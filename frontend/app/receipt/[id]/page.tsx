'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useWebSocket } from '@/hooks/useWebSocket';
import ReceiptPage from '@/components/organisms/ReceiptPage';
import client from '@/lib/graphql-request';
import { MARK_READY, GET_SESSION } from '@/lib/mutations';
import { Item, Member } from '@/types/receipt';

function mergeItems(existing: Item[], incoming: Item[]): Item[] {
    const mergedById = new Map(existing.map(item => [item.id, item]));
    for (const item of incoming) {
        const current = mergedById.get(item.id);
        mergedById.set(item.id, current ? { ...current, ...item } : item);
    }
    return Array.from(mergedById.values());
}

export default function ReceiptRoute() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const sessionId = params?.id as string;
    const displayNameFromUrl = searchParams.get('name');
    const [token, setToken] = useState<string | null>(null);
    const [memberId, setMemberId] = useState<string | null>(null);
    const [items, setItems] = useState<Item[]>([]);
    const [sessionMembers, setSessionMembers] = useState<Member[]>([]);
    const [totalTax, setTotalTax] = useState<number>(0);
    const [totalTip, setTotalTip] = useState<number>(0);
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
    const hasSettledInitialDataRef = useRef(false);
    const scheduledReconcileTimeoutsRef = useRef<number[]>([]);

    const clearScheduledReconciles = useCallback(() => {
        scheduledReconcileTimeoutsRef.current.forEach(id => window.clearTimeout(id));
        scheduledReconcileTimeoutsRef.current = [];
    }, []);

    const reconcileSessionData = useCallback(async (reason: string): Promise<number | null> => {
        if (!sessionId) return null;

        try {
            console.log(`[Receipt] 🔁 Reconciling session data (${reason}) for sessionId:`, sessionId);
            const data: any = await client.request(GET_SESSION, { id: sessionId });
            const { items, members, tax, tip, qrCodeUrl: url } = data.session;

            if (items.length > 0) {
                hasSettledInitialDataRef.current = true;
                clearScheduledReconciles();
            }

            setItems(prev => mergeItems(prev, items));
            setSessionMembers(members);
            setTotalTax(tax ?? 0);
            setTotalTip(tip ?? 0);
            setQrCodeUrl(url ?? '');

            console.log('[Receipt] ✅ Reconcile complete:', {
                itemCount: items.length,
                memberCount: members.length,
                tax,
                tip
            });

            return items.length;
        } catch (error) {
            console.error('[Receipt] ⚠️ Reconcile failed:', error);
            return null;
        }
    }, [sessionId, clearScheduledReconciles]);

    const hasMember = useCallback((id: string | undefined | null) => {
        if (!id) return false;
        return sessionMembers.some(member => member.id === id);
    }, [sessionMembers]);

    useEffect(() => {
        setToken(localStorage.getItem('token'));
        setMemberId(localStorage.getItem('memberId'));
        
        // If display name is in URL, update localStorage so it persists on reload
        if (displayNameFromUrl) {
            localStorage.setItem('displayName', displayNameFromUrl);
        }
    }, [displayNameFromUrl]);

    useEffect(() => {
        if (!sessionId) return;

        console.log('[Receipt] 🔄 Fetching session data for sessionId:', sessionId);
        setIsInitialLoading(true);
        client.request(GET_SESSION, { id: sessionId })
            .then((data: any) => {
                const { items, members, tax, tip, qrCodeUrl: url } = data.session;
                console.log('[Receipt] ✅ Session data received:', {
                    itemCount: items.length,
                    memberCount: members.length,
                    tax,
                    tip,
                    qrCodeUrl: url,
                    items,
                    members
                });
                if (items.length > 0) {
                    hasSettledInitialDataRef.current = true;
                    clearScheduledReconciles();
                }
                setItems(items);
                setSessionMembers(members);
                setTotalTax(tax ?? 0);
                setTotalTip(tip ?? 0);
                setQrCodeUrl(url ?? '');
            })
            .catch((error) => {
                console.error('[Receipt] ❌ Failed to load session data:', error);
            })
            .finally(() => {
                setIsInitialLoading(false);
            });
    }, [sessionId, clearScheduledReconciles]);

    useEffect(() => {
        if (!sessionId) return;

        clearScheduledReconciles();
        if (hasSettledInitialDataRef.current) return;

        const schedule = [1500, 4000, 8000, 12000];

        schedule.forEach((delay, index) => {
            const timeoutId = window.setTimeout(() => {
                if (hasSettledInitialDataRef.current) return;
                reconcileSessionData(`scheduled-${index + 1}`);
            }, delay);
            scheduledReconcileTimeoutsRef.current.push(timeoutId);
        });

        return () => {
            clearScheduledReconciles();
        };
    }, [sessionId, reconcileSessionData, clearScheduledReconciles]);

    const handleWebSocketMessage = useCallback((event: string, payload: any) => {
        console.log('[Receipt WebSocket] 📨 Event received:', event, '| Payload:', payload);
        switch (event) {
            case 'ITEM_CLAIMED':
                console.log('[Receipt WebSocket] 🎯 ITEM_CLAIMED - itemId:', payload.item_id, 'memberId:', payload.claimed_by);
                if (!hasMember(payload.claimed_by)) {
                    console.log('[Receipt WebSocket] 👤 Claimed by unknown member, reconciling session members');
                    void reconcileSessionData('claim-missing-member');
                }
                setItems(prev => {
                    const updated = prev.map(item =>
                        item.id === payload.item_id
                            ? { ...item, claimedBy: { id: payload.claimed_by }, locked: false }
                            : item
                    );
                    console.log('[Receipt] ⚡ Items state updated after ITEM_CLAIMED:', updated);
                    return updated;
                });
                break;
            case 'ITEM_RELEASED':
                console.log('[Receipt WebSocket] 🔓 ITEM_RELEASED - itemId:', payload.item_id);
                setItems(prev => {
                    const updated = prev.map(item =>
                        item.id === payload.item_id
                            ? { ...item, claimedBy: null, locked: false }
                            : item
                    );
                    console.log('[Receipt] ⚡ Items state updated after ITEM_RELEASED:', updated);
                    return updated;
                });
                break;
            case 'ITEM_LOCKED':
                console.log('[Receipt WebSocket] 🔒 ITEM_LOCKED - itemId:', payload.item_id);
                setItems(prev => prev.map(item =>
                    item.id === payload.item_id ? { ...item, locked: true } : item
                ));
                break;
            case 'ITEM_UNLOCKED':
                console.log('[Receipt WebSocket] 🔓 ITEM_UNLOCKED - itemId:', payload.item_id);
                setItems(prev => prev.map(item =>
                    item.id === payload.item_id ? { ...item, locked: false } : item
                ));
                break;
            case 'OCR_ITEM_PARSED':
                console.log('[Receipt WebSocket] 🆕 OCR_ITEM_PARSED - new item:', payload.item);
                if (!payload?.item?.id) {
                    console.error('[Receipt WebSocket] ❌ OCR_ITEM_PARSED missing item.id:', payload);
                    break;
                }
                setItems(prev => mergeItems(prev, [payload.item]));
                break;
            case 'AGENT_ACTION':
                console.log('[Receipt WebSocket] 🤖 AGENT_ACTION - itemId:', payload.item_id, 'action:', payload.action, 'memberId:', payload.member_id);
                if (!hasMember(payload.member_id)) {
                    console.log('[Receipt WebSocket] 👤 Agent action references unknown member, reconciling session members');
                    void reconcileSessionData('agent-missing-member');
                }
                setItems(prev => prev.map(item => {
                    if (item.id !== payload.item_id) return item;
                    return payload.action === 'CLAIMED'
                        ? { ...item, claimedBy: { id: payload.member_id }, locked: false }
                        : { ...item, claimedBy: null, locked: false };
                }));
                break;
            case 'USER_CONNECTED':
            case 'USER_DISCONNECTED':
            case 'USER_RECONNECTED':
            case 'MEMBER_JOINED':
            case 'MEMBER_CONNECTED':
            case 'MEMBER_DISCONNECTED':
                console.log('[Receipt WebSocket] 👥 Member presence change detected, reconciling session members');
                void reconcileSessionData(`presence-${event.toLowerCase()}`);
                break;
            default:
                console.log('[Receipt WebSocket] ❓ Unknown event type:', event);
        }
    }, [hasMember, reconcileSessionData]);

    const handleConnectionLost = useCallback(() => {
        if (!sessionId) return;
        const displayName = window.localStorage.getItem('displayName') ?? '';
        const nameQuery = displayName ? `?name=${encodeURIComponent(displayName)}` : '';
        router.push(`/join/${encodeURIComponent(sessionId)}${nameQuery}`);
    }, [sessionId, router]);

    const handleWebSocketConnected = useCallback(() => {
        console.log('[Receipt] 🟢 WebSocket connected - marking user as online');
        setSessionMembers(prev => prev.map(member =>
            member.id === memberId
                ? { ...member, connected: true }
                : member
        ));

        reconcileSessionData('websocket-connected');
    }, [memberId, reconcileSessionData]);

    useWebSocket(
        sessionId,
        token,
        handleWebSocketMessage,
        handleConnectionLost,
        handleWebSocketConnected
    );

    const handleReady = async () => {
        if (!memberId || !sessionId) return;
        setIsReady(true);
        await client.request(MARK_READY, { sessionId, memberId });
    };

    return (
        <ReceiptPage
            sessionId={sessionId}
            items={items}
            currentMemberId={memberId ?? ''}
            sessionMembers={sessionMembers}
            totalTax={totalTax}
            totalTip={totalTip}
            isItemsLoading={isInitialLoading}
            qrCodeUrl={qrCodeUrl}
            isReady={isReady}
            onReady={handleReady}
        />
    );
}