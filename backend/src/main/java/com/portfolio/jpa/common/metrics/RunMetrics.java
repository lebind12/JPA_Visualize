package com.portfolio.jpa.common.metrics;

import java.util.List;

public record RunMetrics(
        long elapsedMs,
        int queryCount,
        List<String> sqlLog
) {}
