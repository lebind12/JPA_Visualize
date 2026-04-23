package com.portfolio.jpa;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

@SpringBootApplication
@EnableAspectJAutoProxy(exposeProxy = true)
public class JpaPortfolioApplication {

	public static void main(String[] args) {
		SpringApplication.run(JpaPortfolioApplication.class, args);
	}

}
