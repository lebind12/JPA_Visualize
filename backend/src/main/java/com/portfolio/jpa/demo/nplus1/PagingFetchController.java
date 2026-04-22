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
public class PagingFetchController {

    private final PagingFetchScenario pagingFetchScenario;

    @GetMapping("/paging-fetch")
    public ScenarioRunResponse run(@RequestParam String variant) {
        String v = variant.toUpperCase();
        Object result = switch (v) {
            case "BAD"   -> pagingFetchScenario.runBad();
            case "FIXED" -> pagingFetchScenario.runFixed();
            default -> throw new ResponseStatusException(BAD_REQUEST, "variant must be BAD or FIXED");
        };
        RunMetrics m = DemoRunHolder.consume()
                .orElseThrow(() -> new IllegalStateException("no metrics captured"));
        return ScenarioRunResponse.of(
                "nplus1.paging-fetch",
                v,
                m,
                result,
                List.of(
                        "Pageable과 컬렉션 fetch join을 동시에 사용하면 Hibernate는 HHH000104 경고를 찍고 DB에 LIMIT 없이 전체 row를 가져온 뒤 메모리에서 페이징합니다. 데이터가 커질수록 OOM 위험이 커집니다.",
                        "Fixed는 먼저 ID만 페이징(LIMIT 포함)으로 뽑고, WHERE id IN (...) + @EntityGraph로 한 번에 로딩합니다. DB 레벨 페이징이 유지돼 메모리 안전합니다.",
                        "대안으로 @BatchSize나 DTO 프로젝션도 가능하지만, 연관 그래프가 복잡할수록 2단계 조회가 가장 단순하고 안전합니다."
                )
        );
    }
}
