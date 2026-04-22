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
public class ProductReviewsController {

    private final ProductReviewsScenario productReviewsScenario;

    @GetMapping("/product-reviews")
    public ScenarioRunResponse run(@RequestParam String variant) {
        String v = variant.toUpperCase();
        Object result = switch (v) {
            case "BAD"   -> productReviewsScenario.runBad();
            case "FIXED" -> productReviewsScenario.runFixed();
            default -> throw new ResponseStatusException(BAD_REQUEST, "variant must be BAD or FIXED");
        };
        RunMetrics m = DemoRunHolder.consume()
                .orElseThrow(() -> new IllegalStateException("no metrics captured"));
        return ScenarioRunResponse.of(
                "nplus1.product-reviews",
                v,
                m,
                result,
                List.of(
                        "Product.reviews LAZY 컬렉션을 루프마다 접근하면 기본적으로 1 + N 쿼리가 발생합니다.",
                        "Fixed는 default_batch_fetch_size=100 전역 설정에 의해 여러 Product의 reviews 초기화 쿼리가 IN 배치로 묶여 1~2 쿼리로 수렴합니다.",
                        "같은 효과를 @BatchSize(size=N) 필드 애노테이션이나 DTO 집계 쿼리(COUNT/AVG GROUP BY)로도 낼 수 있습니다."
                )
        );
    }
}
