'use client';

import { useEffect, useRef } from 'react';
import { connectWebSocket, disconnectWebSocket } from '@/lib/websocket-client';

/**
 * Connects to the STOMP WebSocket for a session and fires onEvent
 * whenever the server broadcasts ITEM_CLAIMED, ITEM_RELEASED,
 * ITEM_LOCKED, OCR_ITEM_PARSED, USER_DISCONNECTED, AGENT_ACTION.
 *
 * Call this once at the receipt page level and update your items
 * state inside onEvent.
 */
export function useWebSocket(
    sessionId: string | null,
    token: string | null,
    onEvent: (event: string, payload: any) => void,
    onConnectionLost?: () => void
) {
    const onEventRef = useRef(onEvent);
    onEventRef.current = onEvent;

    const onConnectionLostRef = useRef(onConnectionLost);
    onConnectionLostRef.current = onConnectionLost;

    useEffect(() => {
        if (!sessionId || !token) return;

        connectWebSocket(
            sessionId,
            token,
            (event, payload) => {
                onEventRef.current(event, payload);
            },
            () => onConnectionLostRef.current?.(),
        );

        return () => {
            disconnectWebSocket();
        };
    }, [sessionId, token]);
}