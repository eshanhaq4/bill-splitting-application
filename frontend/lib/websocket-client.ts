import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let stompClient: Client | null = null;

export function connectWebSocket(
    sessionId: string,
    token: string,
    onMessage: (event: string, payload: any) => void
) {
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
        }
    });

    stompClient.activate();
}

export function disconnectWebSocket() {
    stompClient?.deactivate();
    stompClient = null;
}