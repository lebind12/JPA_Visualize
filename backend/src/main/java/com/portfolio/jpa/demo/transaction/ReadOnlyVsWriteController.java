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

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@RestController
@RequestMapping("/api/demo/tx")
@RequiredArgsConstructor
public class ReadOnlyVsWriteController {

    private final ReadOnlyVsWriteScenario scenario;
    private final ReadOnlyVsWriteResetService resetService;

    @GetMapping("/read-only-vs-write")
    public ScenarioRunResponse run(
            @RequestParam String variant,
            @RequestParam(defaultValue = "1") long memberId
    ) {
        resetService.resetMemberName(memberId, "원본");

        String v = variant.toUpperCase();
        Map<String, Object> scenarioResult = switch (v) {
            case "BAD" -> scenario.runBad(memberId);
            case "FIXED" -> scenario.runFixed(memberId);
            default -> throw new ResponseStatusException(BAD_REQUEST, "variant must be BAD or FIXED");
        };

        RunMetrics m = DemoRunHolder.consume()
                .orElseThrow(() -> new IllegalStateException("no metrics captured"));

        String committedName = resetService.fetchName(memberId);

        Map<String, Object> result = new LinkedHashMap<>(scenarioResult);
        result.put("committedNameInDb", committedName);

        return ScenarioRunResponse.of(
                "tx.read-only-vs-write",
                v,
                m,
                result,
                List.of(
                        "BAD: @Transactional(readOnly 미지정=false) → 커밋 시 dirty checking이 작동해 실수로 호출한 renameTo가 UPDATE로 나간다.",
                        "FIXED: @Transactional(readOnly = true) → Hibernate가 스냅샷을 뜨지 않고 FlushMode.MANUAL로 바뀌어 같은 renameTo가 UPDATE로 나가지 않는다.",
                        "포인트: readOnly는 단순 최적화가 아니라, 조회 메서드에서 엔티티를 만졌을 때 의도치 않은 UPDATE를 원천 차단하는 가드이기도 하다."
                )
        );
    }
}
