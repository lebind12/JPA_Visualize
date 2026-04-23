package com.portfolio.jpa;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.utility.DockerImageName;

@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

	private static final MySQLContainer<?> MYSQL_CONTAINER;

	static {
		MYSQL_CONTAINER = new MySQLContainer<>(DockerImageName.parse("mysql:8.4"))
				.withReuse(true);
		MYSQL_CONTAINER.start();
	}

	@Bean
	@ServiceConnection
	MySQLContainer<?> mysqlContainer() {
		return MYSQL_CONTAINER;
	}

}
