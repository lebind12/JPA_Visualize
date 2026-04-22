package com.portfolio.jpa.demo.lock;

import com.portfolio.jpa.common.metrics.DemoRun;
import com.portfolio.jpa.demo._framework.ScenarioContributor;
import com.portfolio.jpa.demo._framework.ScenarioMeta;
import com.portfolio.jpa.domain.product.Product;
import com.portfolio.jpa.domain.product.ProductRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class OptimisticStockScenario implements ScenarioContributor {

    private final ProductRepository productRepository;
    private final TransactionTemplate transactionTemplate;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public ScenarioMeta meta() {
        return new ScenarioMeta(
                "lock.optimistic-stock",
                "lock",
                "낙관적 락 재고 차감",
                "/lab/lock-optimistic-stock",
                "HARD",
                "동시 주문으로 재고 차감할 때 @Version 없는 UPDATE는 잃어버린 갱신 발생, @Version은 OptimisticLockException으로 검출해 재시도로 정합성 유지"
        );
    }

    @DemoRun
    @Transactional
    public Map<String, Object> runBad(long productId, int quantity) {
        Product product = productRepository.findById(productId).orElseThrow();
        int before = product.getStock();
        product.decreaseStock(quantity);
        return Map.of(
                "productId", productId,
                "before", before,
                "after", product.getStock(),
                "quantity", quantity
        );
    }

    @DemoRun
    @Transactional
    public Map<String, Object> runFixed(long productId, int quantity) {
        Product product = productRepository.findById(productId).orElseThrow();
        int before = product.getStock();
        product.decreaseStock(quantity);
        return Map.of(
                "productId", productId,
                "before", before,
                "after", product.getStock(),
                "quantity", quantity
        );
    }

    // @DemoRun 붙이지 않음 — ThreadLocal SQL 캡처 섞임 방지
    @Transactional
    public WorkerOutcome executeBadOnce(long productId, int quantity) {
        long t0 = System.nanoTime();
        try {
            // read-modify-write 경쟁 재현: 자바에서 계산 후 네이티브 UPDATE
            int currentStock = ((Number) entityManager
                    .createNativeQuery("select stock from products where id = ?")
                    .setParameter(1, productId)
                    .getSingleResult()).intValue();

            int newStock = currentStock - quantity;
            if (newStock < 0) {
                return new WorkerOutcome(false, 0, "InsufficientStock",
                        elapsed(t0), currentStock);
            }

            entityManager.createNativeQuery("update products set stock = ? where id = ?")
                    .setParameter(1, newStock)
                    .setParameter(2, productId)
                    .executeUpdate();

            return new WorkerOutcome(true, 0, null, elapsed(t0), newStock);
        } catch (Exception e) {
            return new WorkerOutcome(false, 0, e.getClass().getSimpleName(), elapsed(t0), -1);
        }
    }

    // @Transactional 붙이지 않음 — 각 시도마다 TransactionTemplate으로 새 트랜잭션
    public WorkerOutcome executeFixedOnce(long productId, int quantity, int maxRetries) {
        long t0 = System.nanoTime();
        int retries = 0;

        for (int attempt = 0; attempt <= maxRetries; attempt++) {
            final int currentAttempt = attempt;
            try {
                WorkerOutcome outcome = transactionTemplate.<WorkerOutcome>execute(status -> {
                    Product product = productRepository.findById(productId).orElseThrow();
                    int before = product.getStock();
                    if (before < quantity) {
                        return new WorkerOutcome(false, currentAttempt, "InsufficientStock",
                                elapsed(t0), before);
                    }
                    product.decreaseStock(quantity);
                    return new WorkerOutcome(true, currentAttempt, null, elapsed(t0), product.getStock());
                });
                if (outcome != null && !outcome.ok() && "InsufficientStock".equals(outcome.errorType())) {
                    return outcome;
                }
                if (outcome != null) {
                    return new WorkerOutcome(outcome.ok(), retries, outcome.errorType(), elapsed(t0), outcome.stockAfter());
                }
                return new WorkerOutcome(false, retries, "NullOutcome", elapsed(t0), -1);
            } catch (OptimisticLockingFailureException e) {
                retries++;
                if (attempt == maxRetries) {
                    return new WorkerOutcome(false, retries, e.getClass().getSimpleName(), elapsed(t0), -1);
                }
            } catch (Exception e) {
                return new WorkerOutcome(false, retries, e.getClass().getSimpleName(), elapsed(t0), -1);
            }
        }

        return new WorkerOutcome(false, retries, "MaxRetriesExceeded", elapsed(t0), -1);
    }

    private static long elapsed(long t0) {
        return (System.nanoTime() - t0) / 1_000_000;
    }
}
