package com.portfolio.jpa.demo.concurrent;

import java.util.List;

public record ConcurrentRunResponse(
        String scenarioId,
        String variant,
        int threads,
        int quantity,
        long totalMs,
        int succeeded,
        int failed,
        int stockBefore,
        int stockAfter,
        int expectedStockAfter,
        List<RunRecord> runs,
        List<ErrorBucket> errors
) {
    public record RunRecord(
            int threadIdx,
            long startOffsetMs,
            long elapsedMs,
            boolean ok,
            int retries,
            String errorType
    ) {}

    public record ErrorBucket(
            String type,
            int count
    ) {}
}
