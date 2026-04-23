package com.portfolio.jpa.demo.persistence;

import com.portfolio.jpa.common.metrics.DemoRun;
import com.portfolio.jpa.demo._framework.ScenarioContributor;
import com.portfolio.jpa.demo._framework.ScenarioMeta;
import com.portfolio.jpa.domain.order.Order;
import com.portfolio.jpa.domain.order.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class LazyOutsideTxScenario implements ScenarioContributor {

    private final OrderRepository orderRepository;

    @Lazy
    @Autowired
    private LazyOutsideTxScenario self;

    @Override
    public ScenarioMeta meta() {
        return new ScenarioMeta(
                "persistence.lazy-outside-tx",
                "persistence",
                "트랜잭션 밖 LAZY 접근 — LazyInitializationException",
                "/lab/persistence?s=persistence.lazy-outside-tx",
                "MEDIUM",
                "서비스 트랜잭션 안에서 엔티티만 조회하고 트랜잭션 밖(컨트롤러·직렬화)에서 LAZY 컬렉션을 건드리면 LazyInitializationException이 터진다. DTO 투영으로 엔티티를 세션 밖으로 내보내지 않으면 원천 차단된다."
        );
    }

    @Transactional(readOnly = true)
    public Order loadOrderInTx(long orderId) {
        return orderRepository.findById(orderId).orElseThrow();
    }

    @DemoRun
    public Map<String, Object> runBad(long orderId) {
        Order order = self.loadOrderInTx(orderId);
        int size = order.getItems().size();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("orderId", orderId);
        result.put("variant", "BAD");
        result.put("strategy", "RETURN_ENTITY_ACCESS_OUTSIDE_TX");
        result.put("orderLoaded", true);
        result.put("itemCount", size);
        result.put("exceptionCaught", null);
        result.put("exceptionMessage", null);
        return result;
    }

    @DemoRun
    @Transactional(readOnly = true)
    public Map<String, Object> runFixed(long orderId) {
        OrderSummaryHead head = orderRepository.findSummaryHeadById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
        List<OrderItemSummaryDto> items = orderRepository.findItemSummariesByOrderId(orderId);
        OrderSummaryDto summary = new OrderSummaryDto(head.orderId(), head.memberName(), items.size(), items);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("orderId", orderId);
        result.put("variant", "FIXED");
        result.put("strategy", "DTO_PROJECTION");
        result.put("orderLoaded", true);
        result.put("itemCount", items.size());
        result.put("summary", summary);
        result.put("exceptionCaught", null);
        result.put("exceptionMessage", null);
        return result;
    }
}
