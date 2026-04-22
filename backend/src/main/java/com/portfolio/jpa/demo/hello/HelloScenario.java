package com.portfolio.jpa.demo.hello;

import com.portfolio.jpa.common.metrics.DemoRun;
import com.portfolio.jpa.demo._framework.ScenarioContributor;
import com.portfolio.jpa.demo._framework.ScenarioMeta;
import com.portfolio.jpa.domain.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class HelloScenario implements ScenarioContributor {

    private final MemberRepository memberRepository;

    @Override
    public ScenarioMeta meta() {
        return new ScenarioMeta(
                "hello",
                "meta",
                "Hello: 프레임워크 검증",
                "/",
                "EASY",
                "measurement 프레임워크와 /api/demo/* 파이프라인을 검증하는 더미 시나리오."
        );
    }

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
