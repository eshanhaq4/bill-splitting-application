'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWebSocket } from '@/hooks/useWebSocket';
import ReceiptPage from '@/components/organisms/ReceiptPage';
import client from '@/lib/graphql-request';
import { MARK_READY, GET_SESSION } from '@/lib/mutations';
import { Item, Member } from '@/types/receipt';

export default function ReceiptRoute() {
    const router = useRouter();
    const params = useParams();
    const sessionId = params?.id as string;
    const [token, setToken] = useState<string | null>(null);
    const [memberId, setMemberId] = useState<string | null>(null);
    const [items, setItems] = useState<Item[]>([]);
    const [sessionMembers, setSessionMembers] = useState<Member[]>([]);
    const [totalTax, setTotalTax] = useState<number>(0);
    const [totalTip, setTotalTip] = useState<number>(0);
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
    const [isReady, setIsReady] = useState<boolean>(false);

    useEffect(() => {
        if (!sessionId) return;
        setToken(localStorage.getItem(`token_${sessionId}`));
        setMemberId(localStorage.getItem(`memberId_${sessionId}`));
    }, [sessionId]);

    useEffect(() => {
        if (!sessionId) return;

        setIsInitialLoading(true);
        client.request(GET_SESSION, { id: sessionId })
            .then((data: any) => {
                const { items, members, tax, tip, qrCodeUrl: url } = data.session;
                setItems(items);
                setSessionMembers(members);
                setTotalTax(tax ?? 0);
                setTotalTip(tip ?? 0);
                setQrCodeUrl(url ?? '');
            })
            .catch((error) => {
                console.error('Failed to load session data:', error);
            })
            .finally(() => {
                setIsInitialLoading(false);
            });
    }, [sessionId]);

    useWebSocket(
        sessionId,
        token,
        (event, payload) => {
            switch (event) {
                case 'ITEM_CLAIMED':
                    setItems(prev => prev.map(item =>
                        item.id === payload.itemId
                            ? { ...item, claimedBy: { id: payload.claimedBy }, locked: false }
                            : item
                    ));
                    break;
                case 'ITEM_RELEASED':
                    setItems(prev => prev.map(item =>
                        item.id === payload.itemId
                            ? { ...item, claimedBy: null, locked: false }
                            : item
                    ));
                    break;
                case 'ITEM_LOCKED':
                    setItems(prev => prev.map(item =>
                        item.id === payload.itemId ? { ...item, locked: true } : item
                    ));
                    break;
                case 'ITEM_UNLOCKED':
                    setItems(prev => prev.map(item =>
                        item.id === payload.itemId ? { ...item, locked: false } : item
                    ));
                    break;
                case 'AGENT_ACTION':
                    setItems(prev => prev.map(item => {
                        if (item.id !== payload.itemId) return item;
                        return payload.action === 'CLAIMED'
                            ? { ...item, claimedBy: { id: payload.claimedBy }, locked: false }
                            : { ...item, claimedBy: null, locked: false };
                    }));
                    break;
                case 'OCR_ITEM_PARSED':
                    setIsInitialLoading(false);
                    setItems(prev => [...prev, payload.item]);
                    break;
                case 'ALL_READY':
                    router.push(`/summary/${sessionId}`);
                    break;
            }
        },
        () => {
            if (!sessionId) return;
            const displayName = window.localStorage.getItem('displayName') ?? '';
            const nameQuery = displayName ? `?name=${encodeURIComponent(displayName)}` : '';
            router.push(`/join/${encodeURIComponent(sessionId)}${nameQuery}`);
        },
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