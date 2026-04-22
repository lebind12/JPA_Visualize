package com.portfolio.jpa.demo.concurrent;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@RestController
@RequestMapping("/api/demo/concurrent")
@RequiredArgsConstructor
public class ConcurrentRunController {

    private static final String LOCK_OPTIMISTIC_STOCK = "lock.optimistic-stock";
    private static final String LOCK_PESSIMISTIC_STOCK = "lock.pessimistic-stock";
    private static final String LOCK_DEADLOCK = "lock.deadlock";

    private final ConcurrentRunner concurrentRunner;

    @PostMapping("/{scenarioId}")
    public ConcurrentRunResponse run(
            @PathVariable String scenarioId,
            @RequestBody ConcurrentRunRequest req
    ) {
        if (!LOCK_OPTIMISTIC_STOCK.equals(scenarioId)
                && !LOCK_PESSIMISTIC_STOCK.equals(scenarioId)
                && !LOCK_DEADLOCK.equals(scenarioId)) {
            throw new ResponseStatusException(BAD_REQUEST, "지원하지 않는 scenarioId: " + scenarioId);
        }
        if (req.threads() < 1 || req.threads() > 50) {
            throw new ResponseStatusException(BAD_REQUEST, "threads는 1~50 사이여야 합니다.");
        }
        return concurrentRunner.run(scenarioId, req);
    }
}
