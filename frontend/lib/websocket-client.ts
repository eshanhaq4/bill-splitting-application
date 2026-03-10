import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let stompClient: Client | null = null;
let isIntentionalDisconnect = false;
let hasConnected = false;

export function connectWebSocket(
    sessionId: string,
    token: string,
    onMessage: (event: string, payload: any) => void,
    onConnectionLost?: () => void,
    onConnected?: () => void
) {
    console.log('[WebSocket] 🔌 Connecting to session:', sessionId, 'with token:', token.substring(0, 8) + '...');
    isIntentionalDisconnect = false;
    hasConnected = false;

    stompClient = new Client({
        webSocketFactory: () => new SockJS(`http://localhost:8080/ws?token=${token}&session_id=${sessionId}`),
        onConnect: () => {
            console.log('[WebSocket] ✅ Connected successfully to session:', sessionId);
            hasConnected = true;
            onConnected?.();
            stompClient?.subscribe(`/topic/session/${sessionId}`, (message) => {
                const body = JSON.parse(message.body);
                console.log('[WebSocket] 📬 Raw message received:', body);
                console.log('[WebSocket] 📨 Event type:', body.type, '| Payload:', body.payload);
                onMessage(body.type, body.payload);
            });
        },
        onDisconnect: () => {
            console.log('[WebSocket] ⚠️ Disconnected. Intentional:', isIntentionalDisconnect);
        },
        onWebSocketClose: () => {
            console.log('[WebSocket] 🔌 Connection closed. Intentional:', isIntentionalDisconnect, '| Had connected:', hasConnected);
            if (!isIntentionalDisconnect && hasConnected) {
                console.error('[WebSocket] ❌ Unexpected connection loss - triggering redirect callback');
                onConnectionLost?.();
            }
        }
    });

    stompClient.activate();
}

export function disconnectWebSocket() {
    isIntentionalDisconnect = true;
    stompClient?.deactivate();
    stompClient = null;
}