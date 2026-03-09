package com.billsplit.backend.config;

import com.billsplit.backend.service.OcrWorkerService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class OcrWorkerRunner implements CommandLineRunner {

    private final OcrWorkerService ocrWorkerService;

    public OcrWorkerRunner(OcrWorkerService ocrWorkerService) {
        this.ocrWorkerService = ocrWorkerService;
    }

    @Override
    public void run(String... args) throws Exception {
        Thread workerThread = new Thread(ocrWorkerService::poll);
        workerThread.setDaemon(true);
        workerThread.start();
    }
}