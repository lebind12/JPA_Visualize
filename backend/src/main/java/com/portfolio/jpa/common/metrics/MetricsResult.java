package com.portfolio.jpa.common.metrics;

import java.util.List;

public record MetricsResult<T>(
        T result,
        long elapsedMs,
        int queryCount,
        List<String> sqlLog
) {}
