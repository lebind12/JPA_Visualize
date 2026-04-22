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
public class DeadlockController {

    private final DeadlockScenario deadlockScenario;
    private final TransactionTemplate transactionTemplate;

    @PersistenceContext
    private EntityManager entityManager;

    @GetMapping("/deadlock")
    public ScenarioRunResponse run(
            @RequestParam String variant,
            @RequestParam(defaultValue = "5") long productIdA,
            @RequestParam(defaultValue = "6") long productIdB,
            @RequestParam(defaultValue = "1") int quantity,
            @RequestParam(required = false) Integer resetStockTo
    ) {
        String v = variant.toUpperCase();
        if (resetStockTo != null) {
            resetStock(productIdA, resetStockTo);
            resetStock(productIdB, resetStockTo);
        }
        Object result = switch (v) {
            case "BAD"   -> deadlockScenario.runBad(productIdA, productIdB, quantity);
            case "FIXED" -> deadlockScenario.runFixed(productIdA, productIdB, quantity);
            default -> throw new ResponseStatusException(BAD_REQUEST, "variant must be BAD or FIXED");
        };
        RunMetrics m = DemoRunHolder.consume()
                .orElseThrow(() -> new IllegalStateException("no metrics captured"));
        return ScenarioRunResponse.of(
                "lock.deadlock",
                v,
                m,
                result,
                List.of(
                        "단발 실행은 경쟁이 없어 데드락이 발생하지 않습니다. Concurrency Lab에서 N개 동시 요청으로만 재현됩니다.",
                        "Bad는 threadIndex에 따라 A→B 또는 B→A 순서로 교대 획득해 cycle을 만듭니다.",
                        "Fixed는 항상 id 오름차순으로 획득해 cycle이 형성되지 않습니다."
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
