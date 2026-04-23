package com.portfolio.jpa.demo.persistence;

import com.portfolio.jpa.common.metrics.DemoRunHolder;
import com.portfolio.jpa.common.metrics.RunMetrics;
import com.portfolio.jpa.demo._framework.ScenarioRunResponse;
import com.portfolio.jpa.domain.member.Member;
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
@RequestMapping("/api/demo/persistence")
@RequiredArgsConstructor
public class DirtyVsSaveController {

    private final DirtyVsSaveResetService resetService;
    private final DirtyVsSaveScenario scenario;

    @GetMapping("/dirty-vs-save")
    public ScenarioRunResponse run(
            @RequestParam String variant,
            @RequestParam(defaultValue = "1") long memberId
    ) {
        resetService.resetMemberName(memberId, "원본");

        String v = variant.toUpperCase();
        if (!v.equals("BAD") && !v.equals("FIXED")) {
            throw new ResponseStatusException(BAD_REQUEST, "variant must be BAD or FIXED");
        }

        Map<String, Object> scenarioResult;
        if (v.equals("BAD")) {
            Member detached = resetService.loadDetached(memberId);
            scenarioResult = scenario.runBad(detached);
        } else {
            scenarioResult = scenario.runFixed(memberId);
        }

        RunMetrics m = DemoRunHolder.consume()
                .orElseThrow(() -> new IllegalStateException("no metrics captured"));

        String committedName = resetService.fetchName(memberId);

        LinkedHashMap<String, Object> result = new LinkedHashMap<>(scenarioResult);
        result.put("committedNameInDb", committedName);

        return ScenarioRunResponse.of(
                "persistence.dirty-vs-save",
                v,
                m,
                result,
                List.of(
                        "BAD: detached Member를 repository.save(entity)로 명시 저장 → SimpleJpaRepository.save가 isNew=false이므로 em.merge(entity) 호출 → Hibernate가 merge 대상 상태 로드용 SELECT를 한 번 더 발행한 뒤 커밋 시 UPDATE를 발행한다.",
                        "FIXED: @Transactional 안에서 findById로 managed 엔티티를 조회하고 renameTo로 필드만 바꾼다 → save 호출 없이 커밋 시 dirty checking이 변경을 감지해 UPDATE 1회만 발행한다.",
                        "포인트: repository.save()는 '새 엔티티 저장'에만 의미가 있다. 영속 엔티티 수정에 save를 부르는 습관은 merge의 숨은 비용(추가 SELECT + managed 인스턴스 복제)을 짊어진다.",
                        "mergeReturnedDifferentInstance=true는 em.merge가 detached 원본을 그대로 쓰지 않고 새로운 managed 인스턴스를 반환한다는 의미 — 이후 필드 변경은 반환 인스턴스에 해야 반영된다는 점에서 버그 유발 지점이기도 하다."
                )
        );
    }
}
