package com.portfolio.jpa.common.metrics;

import java.util.List;
import java.util.function.Supplier;

public final class MetricsRecorder {

    private MetricsRecorder() {}

    public static <T> MetricsResult<T> record(Supplier<T> body) {
        SqlCaptureContext.start();
        long t0 = System.nanoTime();
        try {
            T result = body.get();
            long elapsedMs = (System.nanoTime() - t0) / 1_000_000;
            List<String> sqls = SqlCaptureContext.snapshot();
            return new MetricsResult<>(result, elapsedMs, sqls.size(), sqls);
        } finally {
            SqlCaptureContext.stop();
        }
    }
}
