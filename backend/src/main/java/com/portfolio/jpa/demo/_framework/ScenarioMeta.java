package com.portfolio.jpa.demo._framework;

public record ScenarioMeta(
        String id,
        String category,
        String title,
        String path,
        String difficulty,
        String summary
) {}
