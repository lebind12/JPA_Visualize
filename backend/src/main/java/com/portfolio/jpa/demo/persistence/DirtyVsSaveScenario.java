package com.portfolio.jpa.demo.persistence;

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
public class DirtyVsSaveScenario implements ScenarioContributor {

    private final MemberRepository memberRepository;

    @Override
    public ScenarioMeta meta() {
        return new ScenarioMeta(
                "persistence.dirty-vs-save",
                "persistence",
                "수정 시 save() 남용 — merge 경로 vs Dirty Checking",
                "/lab/persistence?s=persistence.dirty-vs-save",
                "MEDIUM",
                "영속 엔티티 수정에 repository.save(entity)를 명시 호출하면 내부적으로 em.merge가 호출되어 merge 사전 SELECT가 추가로 발생한다. @Transactional 안에서 managed 엔티티의 필드를 바꾸기만 하면 커밋 시 dirty checking으로 UPDATE 1회만 나간다."
        );
    }

    @DemoRun
    @Transactional
    public Map<String, Object> runBad(Member detached) {
        String nameBefore = detached.getName();
        detached.renameTo(nameBefore + " (modified-BAD)");
        Member returnedByMerge = memberRepository.save(detached);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("memberId", detached.getId());
        result.put("variant", "BAD");
        result.put("strategy", "EXPLICIT_SAVE_MERGE");
        result.put("saveCalled", true);
        result.put("nameBeforeMutation", nameBefore);
        result.put("nameInSessionAfterMutation", returnedByMerge.getName());
        result.put("mergeReturnedDifferentInstance", returnedByMerge != detached);
        return result;
    }

    @DemoRun
    @Transactional
    public Map<String, Object> runFixed(long memberId) {
        Member managed = memberRepository.findById(memberId).orElseThrow();
        String nameBefore = managed.getName();
        managed.renameTo(nameBefore + " (modified-FIXED)");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("memberId", memberId);
        result.put("variant", "FIXED");
        result.put("strategy", "DIRTY_CHECKING_ONLY");
        result.put("saveCalled", false);
        result.put("nameBeforeMutation", nameBefore);
        result.put("nameInSessionAfterMutation", managed.getName());
        return result;
    }
}
