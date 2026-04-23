package com.portfolio.jpa.demo.transaction;

import com.portfolio.jpa.common.metrics.DemoRun;
import com.portfolio.jpa.demo._framework.ScenarioContributor;
import com.portfolio.jpa.demo._framework.ScenarioMeta;
import com.portfolio.jpa.domain.order.Order;
import com.portfolio.jpa.domain.order.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.aop.framework.AopContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SelfInvocationScenario implements ScenarioContributor {

    private final OrderRepository orderRepository;
    private final SelfInvocationInnerService innerService;

    @Lazy
    @Autowired
    private SelfInvocationScenario self;

    @Override
    public ScenarioMeta meta() {
        return new ScenarioMeta(
                "tx.self-invocation",
                "transaction",
                "트랜잭션 자기 호출(Self-Invocation)",
                "/lab/transaction?s=tx.self-invocation",
                "MEDIUM",
                "같은 클래스 안에서 this.method()로 호출하면 Spring AOP 프록시를 우회해 @Transactional이 통째로 무시된다."
        );
    }

    @DemoRun
    public Map<String, Object> runBad(long orderId) {
        String orderStatusBefore = fetchStatus(orderId);
        String exceptionCaught = null;
        String exceptionMessage = null;

        try {
            this.innerBad(orderId);
        } catch (Exception e) {
            exceptionCaught = e.getClass().getSimpleName();
            exceptionMessage = e.getMessage();
        }

        String orderStatusAfter = fetchStatus(orderId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("orderId", orderId);
        result.put("strategyUsed", "THIS_CALL");
        result.put("orderStatusBefore", orderStatusBefore);
        result.put("orderStatusAfter", orderStatusAfter);
        result.put("exceptionCaught", exceptionCaught);
        result.put("exceptionMessage", exceptionMessage);
        return result;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = RuntimeException.class)
    public void innerBad(long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow();
        order.markCompleted();
        orderRepository.saveAndFlush(order);
        throw new IllegalStateException("self-invocation demo");
    }

    @DemoRun
    public Map<String, Object> runFixed(long orderId, String strategy) {
        String orderStatusBefore = fetchStatus(orderId);
        String exceptionCaught = null;
        String exceptionMessage = null;
        String strategyUsed = (strategy == null || strategy.isBlank()) ? "SELF_INJECT" : strategy.toUpperCase();

        try {
            switch (strategyUsed) {
                case "SELF_INJECT" -> self.innerFixed(orderId);
                case "AOP_CONTEXT" -> ((SelfInvocationScenario) AopContext.currentProxy()).innerFixed(orderId);
                case "SEPARATE_BEAN" -> innerService.innerFixed(orderId);
                default -> throw new IllegalArgumentException("알 수 없는 strategy: " + strategyUsed);
            }
        } catch (IllegalStateException e) {
            exceptionCaught = e.getClass().getSimpleName();
            exceptionMessage = e.getMessage();
        } catch (Exception e) {
            exceptionCaught = e.getClass().getSimpleName();
            exceptionMessage = e.getMessage();
        }

        String orderStatusAfter = fetchStatus(orderId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("orderId", orderId);
        result.put("strategyUsed", strategyUsed);
        result.put("orderStatusBefore", orderStatusBefore);
        result.put("orderStatusAfter", orderStatusAfter);
        result.put("exceptionCaught", exceptionCaught);
        result.put("exceptionMessage", exceptionMessage);
        return result;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = RuntimeException.class)
    public void innerFixed(long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow();
        order.markCompleted();
        orderRepository.saveAndFlush(order);
        throw new IllegalStateException("self-invocation demo");
    }

    @Transactional(readOnly = true)
    public String fetchStatus(long orderId) {
        return orderRepository.findById(orderId)
                .map(o -> o.getStatus().name())
                .orElse("NOT_FOUND");
    }
}
