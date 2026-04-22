package com.portfolio.jpa.demo.nplus1;

import com.portfolio.jpa.common.metrics.DemoRun;
import com.portfolio.jpa.demo._framework.ScenarioContributor;
import com.portfolio.jpa.demo._framework.ScenarioMeta;
import com.portfolio.jpa.domain.order.Order;
import com.portfolio.jpa.domain.order.OrderItem;
import com.portfolio.jpa.domain.order.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PagingFetchScenario implements ScenarioContributor {

    private final OrderRepository orderRepository;

    @Override
    public ScenarioMeta meta() {
        return new ScenarioMeta(
                "nplus1.paging-fetch",
                "n-plus-one",
                "페이징 + 컬렉션 fetch join (HHH000104)",
                "/lab/n-plus-one?s=nplus1.paging-fetch",
                "HARD",
                "컬렉션 fetch join에 Pageable을 같이 쏘면 Hibernate가 HHH000104 경고와 함께 DB에 LIMIT 없이 전체 row를 내려받고 메모리에서 잘라냅니다. Fixed는 ID만 페이징으로 조회한 뒤 IN 절 + @EntityGraph로 2단계 로딩해 DB 레벨 페이징을 유지합니다."
        );
    }

    @DemoRun
    @Transactional(readOnly = true)
    public Map<String, Object> runBad() {
        org.springframework.data.domain.Pageable pageable = PageRequest.of(0, 10);
        List<Order> orders = orderRepository.findAllFetchItems(pageable);

        List<Long> orderIds = new ArrayList<>();
        long totalAmount = 0L;
        int itemCount = 0;

        for (Order o : orders) {
            for (OrderItem it : o.getItems()) {
                itemCount++;
                totalAmount += (long) it.getQuantity() * it.getUnitPrice();
            }
            orderIds.add(o.getId());
        }

        return Map.of(
                "orderIds", orderIds,
                "totalAmount", totalAmount,
                "itemCount", itemCount,
                "strategyNote", "paging + collection fetch join → in-memory slicing (HHH000104)"
        );
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
            for (OrderItem it : o.getItems()) {
                itemCount++;
                totalAmount += (long) it.getQuantity() * it.getUnitPrice();
            }
            orderIds.add(o.getId());
        }

        return Map.of(
                "orderIds", orderIds,
                "totalAmount", totalAmount,
                "itemCount", itemCount,
                "strategyNote", "two-step: id paging → entity graph batch load"
        );
    }
}
