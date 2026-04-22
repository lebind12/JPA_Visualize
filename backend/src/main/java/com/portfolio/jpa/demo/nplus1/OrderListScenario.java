package com.portfolio.jpa.demo.nplus1;

import com.portfolio.jpa.common.metrics.DemoRun;
import com.portfolio.jpa.demo._framework.ScenarioContributor;
import com.portfolio.jpa.demo._framework.ScenarioMeta;
import com.portfolio.jpa.domain.order.Order;
import com.portfolio.jpa.domain.order.OrderItem;
import com.portfolio.jpa.domain.order.OrderRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OrderListScenario implements ScenarioContributor {

    private final OrderRepository orderRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public ScenarioMeta meta() {
        return new ScenarioMeta(
                "nplus1.order-list",
                "n-plus-one",
                "주문 목록 N+1",
                "/lab/n-plus-one?s=nplus1.order-list",
                "MEDIUM",
                "주문 10건을 조회하며 member/orderItems/product를 LAZY로 반복 접근 → N+1 폭발. @EntityGraph로 2 쿼리 이내로 수렴."
        );
    }

    @DemoRun
    @Transactional(readOnly = true)
    public Map<String, Object> runBad() {
        List<Long> ids = orderRepository.findFirst10OrderIds(PageRequest.of(0, 10));
        List<Long> orderIds = new ArrayList<>();
        long totalAmount = 0L;
        int itemCount = 0;

        for (Long id : ids) {
            Order o = orderRepository.findById(id).orElseThrow();
            o.getMember().getName();
            for (OrderItem it : o.getItems()) {
                itemCount++;
                totalAmount += (long) it.getQuantity() * it.getUnitPrice();
                it.getProduct().getName();
            }
            orderIds.add(o.getId());
            entityManager.flush();
            entityManager.clear();
        }

        return Map.of("orderIds", orderIds, "totalAmount", totalAmount, "itemCount", itemCount);
    }

    @DemoRun
    @Transactional(readOnly = true)
    public Map<String, Object> runFixed() {
        List<Long> ids = orderRepository.findFirst10OrderIds(PageRequest.of(0, 10));
        List<Order> orders = orderRepository.findAllWithGraphByIds(ids);

        List<Long> orderIds = new ArrayList<>();
        long totalAmount = 0L;
        int itemCount = 0;

        for (Order o : orders) {
            o.getMember().getName();
            for (OrderItem it : o.getItems()) {
                itemCount++;
                totalAmount += (long) it.getQuantity() * it.getUnitPrice();
                it.getProduct().getName();
            }
            orderIds.add(o.getId());
        }

        return Map.of("orderIds", orderIds, "totalAmount", totalAmount, "itemCount", itemCount);
    }
}
