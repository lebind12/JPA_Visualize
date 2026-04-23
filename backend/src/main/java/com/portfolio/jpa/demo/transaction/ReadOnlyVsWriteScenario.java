package com.portfolio.jpa.demo.transaction;

import com.portfolio.jpa.common.metrics.DemoRun;
import com.portfolio.jpa.demo._framework.ScenarioContributor;
import com.portfolio.jpa.demo._framework.ScenarioMeta;
import com.portfolio.jpa.domain.member.Member;
import com.portfolio.jpa.domain.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReadOnlyVsWriteScenario implements ScenarioContributor {

    private final MemberRepository memberRepository;

    @Override
    public ScenarioMeta meta() {
        return new ScenarioMeta(
                "tx.read-only-vs-write",
                "transaction",
                "읽기 전용 트랜잭션 (readOnly = true)",
                "/lab/transaction?s=tx.read-only-vs-write",
                "MEDIUM",
                "단순 조회 메서드에 readOnly를 빠뜨리면 dirty checking이 살아있어 실수로 수정한 엔티티가 커밋 시 UPDATE로 반영된다. readOnly=true면 스냅샷/플러시가 꺼져 같은 실수가 무해해진다."
        );
    }

    @DemoRun
    @Transactional
    public Map<String, Object> runBad(long memberId) {
        Member m = memberRepository.findById(memberId).orElseThrow();
        String nameBeforeMutation = m.getName();
        m.renameTo(nameBeforeMutation + " (oops-BAD)");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("memberId", memberId);
        result.put("nameBeforeMutation", nameBeforeMutation);
        result.put("nameInSessionAfterMutation", m.getName());
        return result;
    }

    @DemoRun
    @Transactional(readOnly = true)
    public Map<String, Object> runFixed(long memberId) {
        Member m = memberRepository.findById(memberId).orElseThrow();
        String nameBeforeMutation = m.getName();
        m.renameTo(nameBeforeMutation + " (oops-FIXED)");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("memberId", memberId);
        result.put("nameBeforeMutation", nameBeforeMutation);
        result.put("nameInSessionAfterMutation", m.getName());
        return result;
    }
}
