package com.portfolio.jpa.demo.nplus1;

import com.portfolio.jpa.common.metrics.DemoRunHolder;
import com.portfolio.jpa.common.metrics.RunMetrics;
import com.portfolio.jpa.support.AbstractIntegrationTest;
import com.portfolio.jpa.support.OrderListFixture;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.HashSet;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class OrderListScenarioIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    OrderListScenario scenario;

    @BeforeAll
    void seedData() {
        txTemplate.executeWithoutResult(status -> OrderListFixture.seed(em));
    }

    @Test
    void runBad_주문10건에_대해_N_plus_1이_발생한다() {
        Map<String, Object> result = scenario.runBad();

        @SuppressWarnings("unchecked")
        List<Long> orderIds = (List<Long>) result.get("orderIds");
        int itemCount = (int) result.get("itemCount");

        assertThat(orderIds).hasSize(10);
        assertThat(itemCount).isGreaterThan(0);

        RunMetrics metrics = DemoRunHolder.consume().orElseThrow();
        System.out.println("[BAD] queryCount=" + metrics.queryCount() + ", sqls=" + metrics.sqlLog());
        assertThat(metrics.queryCount()).isGreaterThanOrEqualTo(20);
    }

    @Test
    void runFixed_EntityGraph로_2쿼리_이내로_수렴한다() {
        Map<String, Object> result = scenario.runFixed();

        @SuppressWarnings("unchecked")
        List<Long> orderIds = (List<Long>) result.get("orderIds");
        int itemCount = (int) result.get("itemCount");

        assertThat(orderIds).hasSize(10);
        assertThat(itemCount).isGreaterThan(0);

        RunMetrics metrics = DemoRunHolder.consume().orElseThrow();
        System.out.println("[FIXED] queryCount=" + metrics.queryCount() + ", sqls=" + metrics.sqlLog());
        assertThat(metrics.queryCount()).isLessThanOrEqualTo(5);
    }

    @Test
    void runBad_와_runFixed는_동일한_orderIds_집합을_반환한다() {
        Map<String, Object> badResult = scenario.runBad();
        DemoRunHolder.consume(); // ThreadLocal 정리

        Map<String, Object> fixedResult = scenario.runFixed();
        DemoRunHolder.consume(); // ThreadLocal 정리

        @SuppressWarnings("unchecked")
        List<Long> badIds = (List<Long>) badResult.get("orderIds");
        @SuppressWarnings("unchecked")
        List<Long> fixedIds = (List<Long>) fixedResult.get("orderIds");

        assertThat(new HashSet<>(badIds)).isEqualTo(new HashSet<>(fixedIds));
    }
}
