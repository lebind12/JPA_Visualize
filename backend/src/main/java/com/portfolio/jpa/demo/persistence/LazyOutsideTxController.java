package com.portfolio.jpa.demo.persistence;

import com.portfolio.jpa.common.metrics.DemoRunHolder;
import com.portfolio.jpa.common.metrics.RunMetrics;
import com.portfolio.jpa.demo._framework.ScenarioRunResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@RestController
@RequestMapping("/api/demo/persistence")
@RequiredArgsConstructor
public class LazyOutsideTxController {

    private final LazyOutsideTxScenario scenario;

    @GetMapping("/lazy-outside-tx")
    public ScenarioRunResponse run(
            @RequestParam String variant,
            @RequestParam(defaultValue = "1") long orderId
    ) {
        String v = variant.toUpperCase();
        if (!v.equals("BAD") && !v.equals("FIXED")) {
            throw new ResponseStatusException(BAD_REQUEST, "variant must be BAD or FIXED");
        }

        Map<String, Object> result = null;
        String exceptionCaught = null;
        String exceptionMessage = null;

        try {
            result = v.equals("BAD") ? scenario.runBad(orderId) : scenario.runFixed(orderId);
        } catch (Exception e) {
            exceptionCaught = e.getClass().getSimpleName();
            exceptionMessage = e.getMessage();

            Map<String, Object> minimalResult = new LinkedHashMap<>();
            minimalResult.put("orderId", orderId);
            minimalResult.put("variant", v);
            minimalResult.put("strategy", v.equals("BAD") ? "RETURN_ENTITY_ACCESS_OUTSIDE_TX" : "DTO_PROJECTION");
            minimalResult.put("orderLoaded", true);
            minimalResult.put("itemCount", null);
            minimalResult.put("summary", null);
            minimalResult.put("exceptionCaught", exceptionCaught);
            minimalResult.put("exceptionMessage", exceptionMessage);
            result = minimalResult;
        }

        if (exceptionCaught == null && result != null) {
            result.put("exceptionCaught", null);
            result.put("exceptionMessage", null);
        }

        RunMetrics m = DemoRunHolder.consume()
                .orElseThrow(() -> new IllegalStateException("no metrics captured"));

        return ScenarioRunResponse.of(
                "persistence.lazy-outside-tx",
                v,
                m,
                result,
                List.of(
                        "BAD: 서비스 @Transactional(readOnly=true) 메서드가 반환한 엔티티를 트랜잭션 밖에서 getItems() 호출 → LAZY 프록시 초기화 시도 → 세션 closed → LazyInitializationException.",
                        "FIXED: JPQL 생성자 표현식으로 DTO 투영 → 엔티티 프록시를 세션 밖으로 내보내지 않음 → LIE 원천 차단.",
                        "근본 대응: 읽기 서비스는 엔티티 대신 DTO를 반환 계약으로 둘 것. fetch join/@EntityGraph는 보조 수단.",
                        "OSIV=true로 숨기는 방법도 있으나, 컨트롤러/뷰까지 세션 유지는 N+1·트랜잭션 범위 모호성의 원인이 된다."
                )
        );
    }
}
