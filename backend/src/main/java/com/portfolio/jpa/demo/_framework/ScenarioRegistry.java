package com.portfolio.jpa.demo._framework;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;

@Component
public class ScenarioRegistry {

    private final List<ScenarioContributor> contributors;
    private final LinkedHashMap<String, ScenarioMeta> registry = new LinkedHashMap<>();

    public ScenarioRegistry(List<ScenarioContributor> contributors) {
        this.contributors = contributors;
    }

    @PostConstruct
    void init() {
        for (ScenarioContributor contributor : contributors) {
            ScenarioMeta meta = contributor.meta();
            if (registry.containsKey(meta.id())) {
                throw new IllegalStateException("중복된 시나리오 id: " + meta.id());
            }
            registry.put(meta.id(), meta);
        }
    }

    public List<ScenarioMeta> all() {
        return List.copyOf(registry.values());
    }

    public Optional<ScenarioMeta> findById(String id) {
        return Optional.ofNullable(registry.get(id));
    }
}
