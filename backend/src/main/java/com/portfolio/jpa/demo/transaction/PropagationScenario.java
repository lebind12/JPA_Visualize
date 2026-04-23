package com.portfolio.jpa.demo.transaction;

import com.portfolio.jpa.common.metrics.DemoRun;
import com.portfolio.jpa.demo._framework.ScenarioContributor;
import com.portfolio.jpa.demo._framework.ScenarioMeta;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PropagationScenario implements ScenarioContributor {

    private final PropagationAuditService auditService;

    @Override
    public ScenarioMeta meta() {
        return new ScenarioMeta(
                "tx.propagation",
                "transaction",
                "트랜잭션 전파 (REQUIRED vs REQUIRES_NEW)",
                "/lab/transaction?s=tx.propagation",
                "MEDIUM",
                "외부 트랜잭션이 실패하면 감사 로그가 REQUIRED에서는 함께 사라지고 REQUIRES_NEW에서는 독립 커밋으로 살아남는다."
        );
    }

    @DemoRun
    @Transactional
    public Map<String, Object> runBad(long memberId) {
        Map<String, Object> result = new LinkedHashMap<>();
        auditService.writeAuditRequired(memberId, "BAD main action");
        throw new IllegalStateException("simulated main-tx failure");
    }

    @DemoRun
    @Transactional
    public Map<String, Object> runFixed(long memberId) {
        Map<String, Object> result = new LinkedHashMap<>();
        auditService.writeAuditRequiresNew(memberId, "FIXED main action");
        throw new IllegalStateException("simulated main-tx failure");
    }
}
