package com.portfolio.jpa.demo.transaction;

import com.portfolio.jpa.domain.order.Order;
import com.portfolio.jpa.domain.order.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SelfInvocationInnerService {

    private final OrderRepository orderRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = RuntimeException.class)
    public void innerFixed(long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow();
        order.markCompleted();
        orderRepository.saveAndFlush(order);
        throw new IllegalStateException("self-invocation demo");
    }

    @Transactional
    public void resetToPending(long orderId) {
        orderRepository.findById(orderId).ifPresent(Order::resetToPending);
    }
}
