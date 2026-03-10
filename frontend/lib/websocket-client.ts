import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let stompClient: Client | null = null;
let isIntentionalDisconnect = false;

export function connectWebSocket(
    sessionId: string,
    token: string,
    onMessage: (event: string, payload: any) => void,
    onConnectionLost?: () => void
) {
    isIntentionalDisconnect = false;

    stompClient = new Client({
        webSocketFactory: () => new SockJS(`http://localhost:8080/ws?token=${token}&session_id=${sessionId}`),
        onConnect: () => {
            console.log('WebSocket connected');
            stompClient?.subscribe(`/topic/session/${sessionId}`, (message) => {
                const body = JSON.parse(message.body);
                onMessage(body.event, body.payload);
            });
        },
        onDisconnect: () => {
            console.log('WebSocket disconnected');
        },
        onWebSocketClose: () => {
            if (!isIntentionalDisconnect) {
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