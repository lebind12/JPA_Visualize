package com.portfolio.jpa.demo._framework;

import com.portfolio.jpa.common.metrics.RunMetrics;

import java.util.List;

public record ScenarioRunResponse(
        String scenarioId,
        String variant,
        long elapsedMs,
        int queryCount,
        List<String> sqlLog,
        Object result,
        List<String> notes
) {
    public static ScenarioRunResponse of(
            String scenarioId,
            String variant,
            RunMetrics metrics,
            Object result,
            List<String> notes
    ) {
        return new ScenarioRunResponse(
                scenarioId,
                variant,
                metrics.elapsedMs(),
                metrics.queryCount(),
                metrics.sqlLog(),
                result,
                notes
        );
    }
}
