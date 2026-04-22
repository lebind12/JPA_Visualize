package com.portfolio.jpa.demo.lock;

import com.portfolio.jpa.common.metrics.DemoRun;
import com.portfolio.jpa.demo._framework.ScenarioContributor;
import com.portfolio.jpa.demo._framework.ScenarioMeta;
import com.portfolio.jpa.domain.product.Product;
import com.portfolio.jpa.domain.product.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.CannotAcquireLockException;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DeadlockLoserDataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.TransactionSystemException;
import org.springframework.transaction.UnexpectedRollbackException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import jakarta.persistence.LockTimeoutException;
import jakarta.persistence.PessimisticLockException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DeadlockScenario implements ScenarioContributor {

    private final ProductRepository productRepository;
    private final TransactionTemplate transactionTemplate;

    @Override
    public ScenarioMeta meta() {
        return new ScenarioMeta(
                "lock.deadlock",
                "lock",
                "데드락 — 역순 락 회피",
                "/lab/lock?s=lock.deadlock",
                "HARD",
                "두 row를 역순으로 잠그는 트랜잭션 간 cycle이 InnoDB에 의해 탐지되어 한쪽이 rollback됨. id 오름차순 락 획득으로 cycle 원천 차단."
        );
    }

    @DemoRun
    @Transactional
    public Map<String, Object> runBad(long a, long b, int quantity) {
        Product productA = productRepository.findByIdForUpdate(a).orElseThrow();
        int beforeA = productA.getStock();
        productA.decreaseStock(quantity);

        Product productB = productRepository.findByIdForUpdate(b).orElseThrow();
        int beforeB = productB.getStock();
        productB.decreaseStock(quantity);

        return Map.of(
                "productIdA", a,
                "productIdB", b,
                "beforeA", beforeA,
                "afterA", productA.getStock(),
                "beforeB", beforeB,
                "afterB", productB.getStock(),
                "quantity", quantity
        );
    }

    @DemoRun
    @Transactional
    public Map<String, Object> runFixed(long a, long b, int quantity) {
        long first = Math.min(a, b);
        long second = Math.max(a, b);

        Product productFirst = productRepository.findByIdForUpdate(first).orElseThrow();
        int beforeFirst = productFirst.getStock();
        productFirst.decreaseStock(quantity);

        Product productSecond = productRepository.findByIdForUpdate(second).orElseThrow();
        int beforeSecond = productSecond.getStock();
        productSecond.decreaseStock(quantity);

        // a와 b 중 어느 쪽이 first/second인지 기준으로 결과 매핑
        int beforeA = (a == first) ? beforeFirst : beforeSecond;
        int afterA  = (a == first) ? productFirst.getStock() : productSecond.getStock();
        int beforeB = (b == first) ? beforeFirst : beforeSecond;
        int afterB  = (b == first) ? productFirst.getStock() : productSecond.getStock();

        return Map.of(
                "productIdA", a,
                "productIdB", b,
                "beforeA", beforeA,
                "afterA", afterA,
                "beforeB", beforeB,
                "afterB", afterB,
                "quantity", quantity
        );
    }

    // @DemoRun 붙이지 않음 — ThreadLocal SQL 캡처 섞임 방지
    // @Transactional 제거 — TransactionTemplate으로 커밋 시점 예외를 catch 범위 안으로 끌어옴
    public WorkerOutcome executeBadOnce(long productIdA, long productIdB, int quantity, int threadIndex) {
        long t0 = System.nanoTime();
        final int[] stockAfterAHolder = {-1};
        try {
            transactionTemplate.execute(status -> {
                // threadIndex 짝수 → A,B 순서 / 홀수 → B,A 순서 (역순 lock 교대로 cycle 유발)
                long first  = (threadIndex % 2 == 0) ? productIdA : productIdB;
                long second = (threadIndex % 2 == 0) ? productIdB : productIdA;

                Product productFirst = productRepository.findByIdForUpdate(first).orElseThrow();
                productFirst.decreaseStock(quantity);

                Product productSecond = productRepository.findByIdForUpdate(second).orElseThrow();
                productSecond.decreaseStock(quantity);

                stockAfterAHolder[0] = (first == productIdA) ? productFirst.getStock() : productSecond.getStock();
                return null;
            });
            return new WorkerOutcome(true, 0, null, elapsed(t0), stockAfterAHolder[0]);
        } catch (DeadlockLoserDataAccessException | CannotAcquireLockException e) {
            return new WorkerOutcome(false, 0, "DeadlockLoser", elapsed(t0), -1);
        } catch (UnexpectedRollbackException | TransactionSystemException e) {
            String msg = e.getMessage();
            String errorType = (msg != null && (msg.contains("deadlock") || msg.contains("Deadlock")))
                    ? "DeadlockLoser"
                    : e.getClass().getSimpleName();
            return new WorkerOutcome(false, 0, errorType, elapsed(t0), -1);
        } catch (DataAccessException e) {
            // JpaSystemException(DataAccessException 하위)도 여기서 포착됨
            String msg = e.getMessage();
            Throwable cause = e.getCause();
            String causeMsg = (cause != null) ? cause.getMessage() : null;
            boolean isDeadlock = (msg != null && (msg.contains("deadlock") || msg.contains("Deadlock")))
                    || (causeMsg != null && (causeMsg.contains("deadlock") || causeMsg.contains("Deadlock")));
            String errorType = isDeadlock ? "DeadlockLoser" : e.getClass().getSimpleName();
            return new WorkerOutcome(false, 0, errorType, elapsed(t0), -1);
        } catch (PessimisticLockException | LockTimeoutException e) {
            return new WorkerOutcome(false, 0, "DeadlockLoser", elapsed(t0), -1);
        } catch (Exception e) {
            String msg = e.getMessage();
            if (msg != null && (msg.contains("deadlock") || msg.contains("Deadlock"))) {
                return new WorkerOutcome(false, 0, "DeadlockLoser", elapsed(t0), -1);
            }
            return new WorkerOutcome(false, 0, e.getClass().getSimpleName(), elapsed(t0), -1);
        }
    }

    // @DemoRun 붙이지 않음 — ThreadLocal SQL 캡처 섞임 방지
    // @Transactional 제거 — TransactionTemplate으로 구조 일관성 유지
    public WorkerOutcome executeFixedOnce(long productIdA, long productIdB, int quantity, int threadIndex) {
        long t0 = System.nanoTime();
        final int[] stockAfterAHolder = {-1};
        try {
            transactionTemplate.execute(status -> {
                long first  = Math.min(productIdA, productIdB);
                long second = Math.max(productIdA, productIdB);

                Product productFirst = productRepository.findByIdForUpdate(first).orElseThrow();
                productFirst.decreaseStock(quantity);

                Product productSecond = productRepository.findByIdForUpdate(second).orElseThrow();
                productSecond.decreaseStock(quantity);

                stockAfterAHolder[0] = (first == productIdA) ? productFirst.getStock() : productSecond.getStock();
                return null;
            });
            return new WorkerOutcome(true, 0, null, elapsed(t0), stockAfterAHolder[0]);
        } catch (DeadlockLoserDataAccessException | CannotAcquireLockException e) {
            return new WorkerOutcome(false, 0, "DeadlockLoser", elapsed(t0), -1);
        } catch (UnexpectedRollbackException | TransactionSystemException e) {
            String msg = e.getMessage();
            String errorType = (msg != null && (msg.contains("deadlock") || msg.contains("Deadlock")))
                    ? "DeadlockLoser"
                    : e.getClass().getSimpleName();
            return new WorkerOutcome(false, 0, errorType, elapsed(t0), -1);
        } catch (DataAccessException e) {
            // JpaSystemException(DataAccessException 하위)도 여기서 포착됨
            String msg = e.getMessage();
            Throwable cause = e.getCause();
            String causeMsg = (cause != null) ? cause.getMessage() : null;
            boolean isDeadlock = (msg != null && (msg.contains("deadlock") || msg.contains("Deadlock")))
                    || (causeMsg != null && (causeMsg.contains("deadlock") || causeMsg.contains("Deadlock")));
            String errorType = isDeadlock ? "DeadlockLoser" : e.getClass().getSimpleName();
            return new WorkerOutcome(false, 0, errorType, elapsed(t0), -1);
        } catch (PessimisticLockException | LockTimeoutException e) {
            return new WorkerOutcome(false, 0, "DeadlockLoser", elapsed(t0), -1);
        } catch (Exception e) {
            String msg = e.getMessage();
            if (msg != null && (msg.contains("deadlock") || msg.contains("Deadlock"))) {
                return new WorkerOutcome(false, 0, "DeadlockLoser", elapsed(t0), -1);
            }
            return new WorkerOutcome(false, 0, e.getClass().getSimpleName(), elapsed(t0), -1);
        }
    }

    private static long elapsed(long t0) {
        return (System.nanoTime() - t0) / 1_000_000;
    }
}
