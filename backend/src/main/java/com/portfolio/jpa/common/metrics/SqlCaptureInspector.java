package com.portfolio.jpa.common.metrics;

import org.hibernate.resource.jdbc.spi.StatementInspector;
import org.springframework.stereotype.Component;

@Component
public class SqlCaptureInspector implements StatementInspector {

    @Override
    public String inspect(String sql) {
        if (SqlCaptureContext.isActive()) {
            SqlCaptureContext.append(sql);
        }
        return sql;
    }
}
