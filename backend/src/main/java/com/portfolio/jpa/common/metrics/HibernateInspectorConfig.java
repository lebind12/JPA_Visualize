package com.portfolio.jpa.common.metrics;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;


@Configuration
@RequiredArgsConstructor
public class HibernateInspectorConfig {

    private final SqlCaptureInspector sqlCaptureInspector;

    @Bean
    public HibernatePropertiesCustomizer hibernateInspectorCustomizer() {
        return (properties) -> properties.put(
                "hibernate.session_factory.statement_inspector",
                sqlCaptureInspector
        );
    }
}
