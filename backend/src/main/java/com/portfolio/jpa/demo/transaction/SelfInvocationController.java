package com.portfolio.jpa.demo.transaction;

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
@RequestMapping("/api/demo/tx")
@RequiredArgsConstructor
public class SelfInvocationController {

    private final SelfInvocationScenario scenario;
    private final SelfInvocationInnerService innerService;

    @GetMapping("/self-invocation")
    public ScenarioRunResponse run(
            @RequestParam String variant,
            @RequestParam(defaultValue = "1") long orderId,
            @RequestParam(defaultValue = "SELF_INJECT") String strategy
    ) {
        // 매 실행마다 Order를 PENDING으로 리셋 (별도 빈의 @Transactional 경유)
        innerService.resetToPending(orderId);

        String v = variant.toUpperCase();
        Object result = switch (v) {
            case "BAD" -> scenario.runBad(orderId);
            case "FIXED" -> scenario.runFixed(orderId, strategy);
            default -> throw new ResponseStatusException(BAD_REQUEST, "variant must be BAD or FIXED");
        };

        RunMetrics m = DemoRunHolder.consume()
                .orElseThrow(() -> new IllegalStateException("no metrics captured"));

        return ScenarioRunResponse.of(
                "tx.self-invocation",
                v,
                m,
                result,
                List.of(
                        "BAD: this.innerBad() 호출은 Spring 프록시를 우회하므로 @Transactional(REQUIRES_NEW)이 동작하지 않는다.",
                        "트랜잭션 없는 상태에서 saveAndFlush가 자기 짧은 트랜잭션으로 UPDATE를 단독 커밋하고, 이후 예외가 나도 되돌릴 수 없다.",
                        "FIXED(SELF_INJECT): @Lazy 자기 주입으로 프록시를 경유해 새 트랜잭션이 열리고 예외 시 saveAndFlush 쓰기까지 함께 롤백된다.",
                        "FIXED(AOP_CONTEXT / SEPARATE_BEAN)도 동일하게 프록시를 경유해 @Transactional이 정상 적용된다."
                )
        );
    }
}
