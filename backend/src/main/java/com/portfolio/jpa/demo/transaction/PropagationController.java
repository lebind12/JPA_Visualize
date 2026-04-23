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
public class PropagationController {

    private final PropagationScenario scenario;
    private final PropagationResetService resetService;

    @GetMapping("/propagation")
    public ScenarioRunResponse run(
            @RequestParam String variant,
            @RequestParam(defaultValue = "1") long memberId
    ) {
        resetService.resetAuditFor(memberId);
        long before = resetService.countAuditFor(memberId);

        String exceptionCaught = null;
        String exceptionMessage = null;

        String v = variant.toUpperCase();
        try {
            switch (v) {
                case "BAD" -> scenario.runBad(memberId);
                case "FIXED" -> scenario.runFixed(memberId);
                default -> throw new ResponseStatusException(BAD_REQUEST, "variant must be BAD or FIXED");
            }
        } catch (Exception e) {
            exceptionCaught = e.getClass().getSimpleName();
            exceptionMessage = e.getMessage();
        }

        RunMetrics m = DemoRunHolder.consume()
                .orElseThrow(() -> new IllegalStateException("no metrics captured"));

        long after = resetService.countAuditFor(memberId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("memberId", memberId);
        result.put("variant", v);
        result.put("auditLogCountBefore", before);
        result.put("auditLogCountAfter", after);
        result.put("exceptionCaught", exceptionCaught);
        result.put("exceptionMessage", exceptionMessage);
        result.put("mainTxFailureSimulated", true);

        return ScenarioRunResponse.of(
                "tx.propagation",
                v,
                m,
                result,
                List.of(
                        "BAD: REQUIRED로 서브 트랜잭션이 외부 TX에 합류 → 외부가 예외로 롤백되면 insert도 함께 롤백된다.",
                        "BAD의 부산물: 서브 내부에서 예외를 catch해 삼켰더라도 외부 TX는 rollback-only로 마킹되어 최종 commit 시 UnexpectedRollbackException이 터진다.",
                        "FIXED: REQUIRES_NEW는 외부 TX를 일시정지하고 새 물리 커넥션/트랜잭션으로 insert를 독립 커밋 → 외부 롤백 영향 없음.",
                        "실전 교훈: 실패해도 반드시 남아야 하는 기록(감사 로그·알림 이력·외부 연동 audit)은 REQUIRES_NEW."
                )
        );
    }
}
