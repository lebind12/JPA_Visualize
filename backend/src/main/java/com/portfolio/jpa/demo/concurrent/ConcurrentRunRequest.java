package com.portfolio.jpa.demo.concurrent;

public record ConcurrentRunRequest(
        String variant,
        int threads,
        long productId,
        int quantity,
        Integer maxRetries,
        Integer resetStockTo
) {}
