package com.portfolio.jpa.common.metrics;

import java.util.ArrayList;
import java.util.List;

public final class SqlCaptureContext {

    private static final ThreadLocal<List<String>> SQL_LIST = new ThreadLocal<>();

    private SqlCaptureContext() {}

    public static void start() {
        SQL_LIST.set(new ArrayList<>());
    }

    public static void stop() {
        SQL_LIST.remove();
    }

    public static boolean isActive() {
        return SQL_LIST.get() != null;
    }

    public static void append(String sql) {
        List<String> list = SQL_LIST.get();
        if (list != null) {
            list.add(sql);
        }
    }

    public static List<String> snapshot() {
        List<String> list = SQL_LIST.get();
        if (list == null) {
            return List.of();
        }
        return List.copyOf(list);
    }
}
