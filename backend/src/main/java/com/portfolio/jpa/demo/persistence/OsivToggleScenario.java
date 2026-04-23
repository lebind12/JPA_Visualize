package com.portfolio.jpa.demo.persistence;

import com.portfolio.jpa.common.metrics.DemoRun;
import com.portfolio.jpa.demo._framework.ScenarioContributor;
import com.portfolio.jpa.demo._framework.ScenarioMeta;
import com.portfolio.jpa.domain.order.Order;
import com.portfolio.jpa.domain.order.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.env.Environment;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OsivToggleScenario implements ScenarioContributor {

    private final OrderRepository orderRepository;
    private final Environment env;

    @Lazy
    @Autowired
    private OsivToggleScenario self;

    @Override
    public ScenarioMeta meta() {
        return new ScenarioMeta(
                "persistence.osiv-toggle",
                "persistence",
                "OSIV 토글 — 리스트 반복 LAZY 접근의 두 얼굴",
                "/lab/persistence?s=persistence.osiv-toggle",
                "HARD",
                "같은 코드(TX 밖 LAZY 반복)가 OSIV=false면 LazyInitializationException으로, OSIV=true면 N+1 폭증으로 나타난다. 해결은 DTO 계약."
        );
    }

    @Transactional(readOnly = true)
    public List<Order> loadOrdersInTx(int limit) {
        List<Long> ids = orderRepository.findFirst10OrderIds(PageRequest.of(0, limit));
        List<Order> orders = orderRepository.findAllById(ids);
        return orders.stream().sorted(Comparator.comparing(Order::getId)).toList();
    }

    @DemoRun
    public Map<String, Object> runBad(int limit) {
        List<Order> orders = self.loadOrdersInTx(limit);

        int touchedCount = 0;
        int totalItemCount = 0;

        for (Order order : orders) {
            order.getMember().getName();
            totalItemCount += order.getItems().size();
            touchedCount++;
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("ordersLoaded", orders.size());
        result.put("variant", "BAD");
        result.put("strategy", "ITERATE_ENTITIES_OUTSIDE_TX");
        result.put("touchedCount", touchedCount);
        result.put("totalItemCount", totalItemCount);
        result.put("osivActive", env.getProperty("spring.jpa.open-in-view", Boolean.class, false));
        result.put("exceptionCaught", null);
        result.put("exceptionMessage", null);
        return result;
    }

    @DemoRun
    @Transactional(readOnly = true)
    public Map<String, Object> runFixed(int limit) {
        List<Long> ids = orderRepository.findFirst10OrderIds(PageRequest.of(0, limit));

        List<OrderSummaryDto> summaries = new ArrayList<>();
        for (Long id : ids) {
            orderRepository.findSummaryHeadById(id).ifPresent(head -> {
                List<OrderItemSummaryDto> items = orderRepository.findItemSummariesByOrderId(id);
                summaries.add(new OrderSummaryDto(head.orderId(), head.memberName(), items.size(), items));
            });
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("ordersLoaded", ids.size());
        result.put("variant", "FIXED");
        result.put("strategy", "DTO_PROJECTION_LIST");
        result.put("summaries", summaries);
        result.put("osivActive", env.getProperty("spring.jpa.open-in-view", Boolean.class, false));
        result.put("exceptionCaught", null);
        result.put("exceptionMessage", null);
        return result;
    }
}
