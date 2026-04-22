package com.portfolio.jpa.demo.hello;

import com.portfolio.jpa.common.metrics.DemoRun;
import com.portfolio.jpa.domain.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class HelloScenario {

    private final MemberRepository memberRepository;

    @DemoRun
    @Transactional(readOnly = true)
    public Map<String, Object> runBad() {
        long totalMembers = 0;
        for (int i = 0; i < 10; i++) {
            totalMembers = memberRepository.count();
        }
        return Map.of(
                "totalMembers", totalMembers,
                "iterations", 10
        );
    }

    @DemoRun
    @Transactional(readOnly = true)
    public Map<String, Object> runFixed() {
        long totalMembers = memberRepository.count();
        return Map.of(
                "totalMembers", totalMembers,
                "iterations", 1
        );
    }
}
