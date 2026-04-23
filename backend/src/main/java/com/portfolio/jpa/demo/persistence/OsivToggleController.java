package com.portfolio.jpa.demo.persistence;

import com.portfolio.jpa.common.metrics.DemoRunHolder;
import com.portfolio.jpa.common.metrics.RunMetrics;
import com.portfolio.jpa.demo._framework.ScenarioRunResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
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
public class OsivToggleController {

    private final OsivToggleScenario scenario;
    private final Environment env;

    @GetMapping("/osiv-toggle")
    public ScenarioRunResponse run(
            @RequestParam String variant,
            @RequestParam(defaultValue = "5") int limit
    ) {
        String v = variant.toUpperCase();
        if (!v.equals("BAD") && !v.equals("FIXED")) {
            throw new ResponseStatusException(BAD_REQUEST, "variant must be BAD or FIXED");
        }
        if (limit < 1 || limit > 20) {
            throw new ResponseStatusException(BAD_REQUEST, "limit must be between 1 and 20");
        }

        Map<String, Object> result = null;
        String exceptionCaught = null;
        String exceptionMessage = null;

        try {
            if (v.equals("BAD")) {
                result = scenario.runBad(limit);
            } else {
                result = scenario.runFixed(limit);
            }
        } catch (Exception e) {
            exceptionCaught = e.getClass().getSimpleName();
            exceptionMessage = e.getMessage();

            Map<String, Object> minimalResult = new LinkedHashMap<>();
            minimalResult.put("ordersLoaded", null);
            minimalResult.put("variant", v);
            minimalResult.put("strategy", v.equals("BAD") ? "ITERATE_ENTITIES_OUTSIDE_TX" : "DTO_PROJECTION_LIST");
            minimalResult.put("touchedCount", 0);
            minimalResult.put("totalItemCount", 0);
            minimalResult.put("osivActive", env.getProperty("spring.jpa.open-in-view", Boolean.class, false));
            minimalResult.put("exceptionCaught", exceptionCaught);
            minimalResult.put("exceptionMessage", exceptionMessage);
            result = minimalResult;
        }

        RunMetrics m = DemoRunHolder.consume()
                .orElseThrow(() -> new IllegalStateException("no metrics captured"));

        return ScenarioRunResponse.of(
                "persistence.osiv-toggle",
                v,
                m,
                result,
                List.of(
                        "BAD + OSIV=false: TX 종료로 세션 닫힘 → 반복문에서 첫 LAZY 접근 시 LazyInitializationException.",
                        "BAD + OSIV=true: 세션이 요청 끝까지 살아 있어 예외는 없지만 매 반복마다 별도 SELECT가 나가 N+1이 폭증한다.",
                        "FIXED: 서비스 TX 안에서 DTO로만 조립 → OSIV 설정 무관하게 동일 동작. 명시적 계약.",
                        "OSIV=true는 증상(예외)을 가릴 뿐 N+1 원인은 그대로. Spring Boot 2.0+부터 기본값이 false로 권장되는 이유."
                )
        );
    }
}
