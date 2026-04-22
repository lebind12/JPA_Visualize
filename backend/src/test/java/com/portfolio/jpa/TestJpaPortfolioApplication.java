package com.portfolio.jpa;

import org.springframework.boot.SpringApplication;

public class TestJpaPortfolioApplication {

	public static void main(String[] args) {
		SpringApplication.from(JpaPortfolioApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
