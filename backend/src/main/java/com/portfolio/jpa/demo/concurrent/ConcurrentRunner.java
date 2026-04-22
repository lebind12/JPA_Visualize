package com.portfolio.jpa.demo.concurrent;

import com.portfolio.jpa.demo.lock.OptimisticStockScenario;
import com.portfolio.jpa.demo.lock.WorkerOutcome;
import com.portfolio.jpa.domain.product.ProductRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class ConcurrentRunner {

    private final OptimisticStockScenario optimisticStockScenario;
    private final ProductRepository productRepository;
    private final TransactionTemplate transactionTemplate;

    @PersistenceContext
    private EntityManager entityManager;

    public ConcurrentRunResponse run(String scenarioId, ConcurrentRunRequest req) {
        String variant = req.variant().toUpperCase();
        int threads = req.threads();
        long productId = req.productId();
        int quantity = req.quantity();
        int maxRetries = req.maxRetries() != null ? req.maxRetries() : 3;

        // 재고 리셋
        if (req.resetStockTo() != null) {
            int stockTo = req.resetStockTo();
            transactionTemplate.execute(status -> {
                entityManager.createNativeQuery(
                        "update products set stock = :stock, version = version + 1 where id = :id")
                        .setParameter("stock", stockTo)
                        .setParameter("id", productId)
                        .executeUpdate();
                return null;
            });
        }

        int stockBefore = productRepository.findById(productId)
                .map(p -> p.getStock())
                .orElseThrow();

        List<Object[]> rawResults = new ArrayList<>();
        for (int i = 0; i < threads; i++) rawResults.add(null);

        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threads);
        long globalStart = System.nanoTime();

        for (int i = 0; i < threads; i++) {
            final int idx = i;
            executor.submit(() -> {
                try {
                    startLatch.await();
                    long threadStart = System.nanoTime();
                    long startOffsetMs = (threadStart - globalStart) / 1_000_000;

                    WorkerOutcome outcome;
                    if ("BAD".equals(variant)) {
                        outcome = optimisticStockScenario.executeBadOnce(productId, quantity);
                    } else {
                        outcome = optimisticStockScenario.executeFixedOnce(productId, quantity, maxRetries);
                    }

                    rawResults.set(idx, new Object[]{startOffsetMs, outcome});
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown();

        try {
            doneLatch.await(30, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            executor.shutdown();
            try {
                executor.awaitTermination(10, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        long totalMs = (System.nanoTime() - globalStart) / 1_000_000;

        int succeeded = 0;
        int failed = 0;
        Map<String, Integer> errorMap = new LinkedHashMap<>();
        List<ConcurrentRunResponse.RunRecord> runs = new ArrayList<>();

        for (int i = 0; i < threads; i++) {
            Object[] raw = rawResults.get(i);
            if (raw == null) continue;
            long startOffsetMs = (long) raw[0];
            WorkerOutcome outcome = (WorkerOutcome) raw[1];

            runs.add(new ConcurrentRunResponse.RunRecord(
                    i,
                    startOffsetMs,
                    outcome.elapsedMs(),
                    outcome.ok(),
                    outcome.retries(),
                    outcome.errorType()
            ));

            if (outcome.ok()) {
                succeeded++;
            } else {
                failed++;
                if (outcome.errorType() != null) {
                    errorMap.merge(outcome.errorType(), 1, Integer::sum);
                }
            }
        }

        int stockAfter = productRepository.findById(productId)
                .map(p -> p.getStock())
                .orElse(-1);

        int expectedStockAfter = stockBefore - threads * quantity;

        List<ConcurrentRunResponse.ErrorBucket> errors = errorMap.entrySet().stream()
                .map(e -> new ConcurrentRunResponse.ErrorBucket(e.getKey(), e.getValue()))
                .toList();

        return new ConcurrentRunResponse(
                scenarioId, variant, threads, quantity,
                totalMs, succeeded, failed,
                stockBefore, stockAfter, expectedStockAfter,
                runs, errors
        );
    }
}
