package com.portfolio.jpa.demo.nplus1;

import com.portfolio.jpa.common.metrics.DemoRunHolder;
import com.portfolio.jpa.common.metrics.RunMetrics;
import com.portfolio.jpa.demo._framework.ScenarioRunResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@RestController
@RequestMapping("/api/demo/nplus1")
@RequiredArgsConstructor
public class OrderListController {

    private final OrderListScenario orderListScenario;

    @GetMapping("/order-list")
    public ScenarioRunResponse run(@RequestParam String variant) {
        String v = variant.toUpperCase();
        Object result = switch (v) {
            case "BAD"   -> orderListScenario.runBad();
            case "FIXED" -> orderListScenario.runFixed();
            default -> throw new ResponseStatusException(BAD_REQUEST, "variant must be BAD or FIXED");
        };
        RunMetrics m = DemoRunHolder.consume()
                .orElseThrow(() -> new IllegalStateException("no metrics captured"));
        return ScenarioRunResponse.of(
                "nplus1.order-list",
                v,
                m,
                result,
                List.of(
                        "LAZY 연관(member/items/product)을 반복 접근하면 기본적으로 1 + N(+N) 쿼리가 발생합니다.",
                        "Fixed는 member·items·items.product를 @EntityGraph로 한 번에 로딩해 2 쿼리 이내로 수렴합니다.",
                        "컬렉션 fetch는 카티션 곱이 발생하므로 distinct 또는 LinkedHashSet이 필요합니다."
                )
        );
    }
}
