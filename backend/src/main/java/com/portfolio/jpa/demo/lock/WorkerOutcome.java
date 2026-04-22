package com.portfolio.jpa.demo.lock;

public record WorkerOutcome(boolean ok, int retries, String errorType, long elapsedMs, int stockAfter) {}
