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
public class OptimisticStockController {

    private final OptimisticStockScenario optimisticStockScenario;
    private final TransactionTemplate transactionTemplate;

    @PersistenceContext
    private EntityManager entityManager;

    @GetMapping("/optimistic-stock")
    public ScenarioRunResponse run(
            @RequestParam String variant,
            @RequestParam(defaultValue = "1") long productId,
            @RequestParam(defaultValue = "1") int quantity,
            @RequestParam(required = false) Integer resetStockTo
    ) {
        String v = variant.toUpperCase();
        if (resetStockTo != null) {
            resetStock(productId, resetStockTo);
        }
        Object result = switch (v) {
            case "BAD"   -> optimisticStockScenario.runBad(productId, quantity);
            case "FIXED" -> optimisticStockScenario.runFixed(productId, quantity);
            default -> throw new ResponseStatusException(BAD_REQUEST, "variant must be BAD or FIXED");
        };
        RunMetrics m = DemoRunHolder.consume()
                .orElseThrow(() -> new IllegalStateException("no metrics captured"));
        return ScenarioRunResponse.of(
                "lock.optimistic-stock",
                v,
                m,
                result,
                List.of(
                        "단발 실행만으로는 경쟁이 없어 Bad/Fixed 차이가 드러나지 않습니다. Concurrency Lab에서 N개 동시 요청을 확인하세요.",
                        "Bad는 네이티브 UPDATE로 read-modify-write 경쟁을 재현합니다.",
                        "Fixed는 @Version으로 충돌을 감지하고 REQUIRES_NEW 트랜잭션으로 재시도합니다."
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
