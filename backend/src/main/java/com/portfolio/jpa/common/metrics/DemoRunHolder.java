package com.portfolio.jpa.common.metrics;

import java.util.Optional;

public final class DemoRunHolder {

    private static final ThreadLocal<RunMetrics> HOLDER = new ThreadLocal<>();

    private DemoRunHolder() {}

    public static void set(RunMetrics metrics) {
        HOLDER.set(metrics);
    }

    public static Optional<RunMetrics> consume() {
        RunMetrics metrics = HOLDER.get();
        HOLDER.remove();
        return Optional.ofNullable(metrics);
    }
}
