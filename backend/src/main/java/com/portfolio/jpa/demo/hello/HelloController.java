package com.portfolio.jpa.demo.hello;

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
@RequestMapping("/api/demo/hello")
@RequiredArgsConstructor
public class HelloController {

    private final HelloScenario helloScenario;

    @GetMapping
    public ScenarioRunResponse run(@RequestParam String variant) {
        String v = variant.toUpperCase();
        Object result = switch (v) {
            case "BAD"   -> helloScenario.runBad();
            case "FIXED" -> helloScenario.runFixed();
            default -> throw new ResponseStatusException(BAD_REQUEST, "variant must be BAD or FIXED");
        };
        RunMetrics m = DemoRunHolder.consume()
                .orElseThrow(() -> new IllegalStateException("no metrics captured"));
        return ScenarioRunResponse.of("hello", v, m, result, List.of("검증용 더미 시나리오"));
    }
}
