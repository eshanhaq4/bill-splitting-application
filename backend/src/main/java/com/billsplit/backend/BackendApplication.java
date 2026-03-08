package com.billsplit.backend;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {

		Dotenv dotenv = Dotenv.load();
		System.setProperty("DB_URL", dotenv.get("DB_URL"));
		System.setProperty("DB_USERNAME", dotenv.get("DB_USERNAME"));
		System.setProperty("DB_PASSWORD", dotenv.get("DB_PASSWORD"));

		System.setProperty("REDIS_HOST", dotenv.get("REDIS_HOST", "localhost"));
		System.setProperty("REDIS_PORT", dotenv.get("REDIS_PORT", "6379"));
		System.setProperty("REDIS_PASSWORD", dotenv.get("REDIS_PASSWORD", ""));

		SpringApplication.run(BackendApplication.class, args);
	}
}