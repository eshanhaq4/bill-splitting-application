package com.billsplit.backend.listener;

import com.billsplit.backend.service.DisconnectDetectionService;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import java.util.Map;

@Component
public class WebSocketEventListener {

    private final DisconnectDetectionService disconnectDetectionService;

    public WebSocketEventListener(DisconnectDetectionService disconnectDetectionService) {
        this.disconnectDetectionService = disconnectDetectionService;
    }

   @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        
        // Get attributes from the connect message
        StompHeaderAccessor connectHeaders = StompHeaderAccessor.wrap(
            (org.springframework.messaging.Message<?>) headerAccessor.getHeader(StompHeaderAccessor.CONNECT_MESSAGE_HEADER)
        );
        
        if (connectHeaders != null && connectHeaders.getSessionAttributes() != null) {
            String token = (String) connectHeaders.getSessionAttributes().get("token");
            String sessionId = (String) connectHeaders.getSessionAttributes().get("session_id");
            
            if (token != null && sessionId != null) {
                System.out.println("Member connected: token=" + token + " sessionId=" + sessionId);
                disconnectDetectionService.onMemberReconnectedByToken(token, sessionId);
            }
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        
        Map<String, Object> attributes = headerAccessor.getSessionAttributes();
        if (attributes != null) {
            String token = (String) attributes.get("token");
            String sessionId = (String) attributes.get("session_id");

            if (token != null && sessionId != null) {
                System.out.println("Member disconnected: token=" + token + " sessionId=" + sessionId);
                disconnectDetectionService.onMemberDisconnectedByToken(token, sessionId);
            }
        }
    }
}