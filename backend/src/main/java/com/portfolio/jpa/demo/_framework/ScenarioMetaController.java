package com.portfolio.jpa.demo._framework;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/demo")
public class ScenarioMetaController {

    private final ScenarioRegistry registry;

    public ScenarioMetaController(ScenarioRegistry registry) {
        this.registry = registry;
    }

    @GetMapping("/scenarios")
    public List<ScenarioMeta> list() {
        return registry.all();
    }
}
