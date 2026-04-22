package com.portfolio.jpa.common.metrics;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

@Aspect
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class DemoRunAspect {

    @Around("@annotation(com.portfolio.jpa.common.metrics.DemoRun)")
    public Object around(ProceedingJoinPoint joinPoint) throws Throwable {
        SqlCaptureContext.start();
        long t0 = System.nanoTime();
        try {
            Object result = joinPoint.proceed();
            return result;
        } finally {
            long elapsedMs = (System.nanoTime() - t0) / 1_000_000;
            List<String> sqls = SqlCaptureContext.snapshot();
            SqlCaptureContext.stop();
            DemoRunHolder.set(new RunMetrics(elapsedMs, sqls.size(), sqls));
        }
    }
}
