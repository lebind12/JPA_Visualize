package com.portfolio.jpa.demo.lock;

import com.portfolio.jpa.common.metrics.DemoRunHolder;
import com.portfolio.jpa.common.metrics.RunMetrics;
import com.portfolio.jpa.demo._framework.ScenarioRunResponse;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@RestController
@RequestMapping("/api/demo/lock")
@RequiredArgsConstructor
public class PessimisticStockController {

    private final PessimisticStockScenario pessimisticStockScenario;
    private final TransactionTemplate transactionTemplate;

    @PersistenceContext
    private EntityManager entityManager;

    @GetMapping("/pessimistic-stock")
    public ScenarioRunResponse run(
            @RequestParam String variant,
            @RequestParam(defaultValue = "3") long productId,
            @RequestParam(defaultValue = "1") int quantity,
            @RequestParam(required = false) Integer resetStockTo
    ) {
        String v = variant.toUpperCase();
        if (resetStockTo != null) {
            resetStock(productId, resetStockTo);
        }
        Object result = switch (v) {
            case "BAD"   -> pessimisticStockScenario.runBad(productId, quantity);
            case "FIXED" -> pessimisticStockScenario.runFixed(productId, quantity);
            default -> throw new ResponseStatusException(BAD_REQUEST, "variant must be BAD or FIXED");
        };
        RunMetrics m = DemoRunHolder.consume()
                .orElseThrow(() -> new IllegalStateException("no metrics captured"));
        return ScenarioRunResponse.of(
                "lock.pessimistic-stock",
                v,
                m,
                result,
                List.of(
                        "단발 실행만으로는 경쟁이 없어 Bad/Fixed 차이가 드러나지 않습니다. Concurrency Lab에서 N개 동시 요청을 확인하세요.",
                        "Bad는 네이티브 UPDATE로 read-modify-write 경쟁을 재현합니다 — 잃어버린 갱신 발생.",
                        "Fixed는 @Lock(PESSIMISTIC_WRITE)로 SELECT ... FOR UPDATE를 걸어 대기 후 직렬화합니다 — 예외 없이 정합성 유지."
                )
        );
    }

    private void resetStock(long productId, int stockTo) {
        transactionTemplate.execute(status -> {
            entityManager.createNativeQuery(
                    "update products set stock = :stock, version = version + 1 where id = :id")
                    .setParameter("stock", stockTo)
                    .setParameter("id", productId)
                    .executeUpdate();
            return null;
        });
    }
}
