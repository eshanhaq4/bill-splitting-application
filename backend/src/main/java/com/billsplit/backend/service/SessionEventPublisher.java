package com.billsplit.backend.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class SessionEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public SessionEventPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publish(String sessionId, String eventType, Object payload) {
        messagingTemplate.convertAndSend(
            "/topic/session/" + sessionId,
            Map.of("type", eventType, "payload", payload)
        );
    }
}