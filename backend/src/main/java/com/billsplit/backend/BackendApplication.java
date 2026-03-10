package com.billsplit.backend;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = "com.billsplit.backend")
@EnableScheduling
@EnableJpaRepositories(basePackages = "com.billsplit.backend.repository")
@EntityScan(basePackages = "com.billsplit.backend.model")
public class BackendApplication {

	public static void main(String[] args) {

		Dotenv dotenv = Dotenv.load();
		System.setProperty("DB_URL", dotenv.get("DB_URL"));
		System.setProperty("DB_USERNAME", dotenv.get("DB_USERNAME"));
		System.setProperty("DB_PASSWORD", dotenv.get("DB_PASSWORD"));

		System.setProperty("REDIS_HOST", dotenv.get("REDIS_HOST", "localhost"));
		System.setProperty("REDIS_PORT", dotenv.get("REDIS_PORT", "6379"));
		System.setProperty("REDIS_PASSWORD", dotenv.get("REDIS_PASSWORD", ""));

		System.setProperty("SUPABASE_URL", dotenv.get("SUPABASE_URL", ""));
		System.setProperty("SUPABASE_KEY", dotenv.get("SUPABASE_KEY", ""));
		System.setProperty("SUPABASE_BUCKET", dotenv.get("SUPABASE_BUCKET", "Receipts"));
		System.setProperty("OCR_QUEUE_NAME", dotenv.get("OCR_QUEUE_NAME", "receipt_ocr_queue"));

		System.setProperty("ACCESS_KEY", dotenv.get("ACCESS_KEY", ""));
		System.setProperty("SECRET_KEY", dotenv.get("SECRET_KEY", ""));
		System.setProperty("ENDPOINT", dotenv.get("ENDPOINT", ""));
		System.setProperty("REGION", dotenv.get("REGION", "us-east-1"));
		System.setProperty("BUCKET", dotenv.get("BUCKET", "Receipts"));

		System.setProperty("REDIS_SSL", dotenv.get("REDIS_SSL", "false"));
		System.setProperty("PORT", dotenv.get("PORT", "8081"));

		SpringApplication.run(BackendApplication.class, args);
	}
}