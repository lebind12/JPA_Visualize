package com.portfolio.jpa.support;

import com.portfolio.jpa.TestcontainersConfiguration;
import com.portfolio.jpa.common.metrics.DemoRunHolder;
import com.portfolio.jpa.common.metrics.SqlCaptureContext;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.support.TransactionTemplate;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
public abstract class AbstractIntegrationTest {

    @PersistenceContext
    protected EntityManager em;

    @Autowired
    protected TransactionTemplate txTemplate;

    @BeforeEach
    void cleanUpThreadLocals() {
        DemoRunHolder.consume();
        SqlCaptureContext.stop();
    }
}
