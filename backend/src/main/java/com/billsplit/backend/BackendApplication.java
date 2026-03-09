package com.billsplit.backend;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.billsplit.backend")
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
		System.setProperty("SUPABASE_BUCKET", dotenv.get("SUPABASE_BUCKET", "receipts"));
		System.setProperty("OCR_QUEUE_NAME", dotenv.get("OCR_QUEUE_NAME", "receipt_ocr_queue"));

		SpringApplication.run(BackendApplication.class, args);
	}
}