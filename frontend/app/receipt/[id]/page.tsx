'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWebSocket } from '@/hooks/useWebSocket';
import ReceiptPage from '@/components/organisms/ReceiptPage';
import client from '@/lib/graphql-request';
import { GET_SESSION } from '@/lib/mutations';
import { Item, Member } from '@/types/receipt';
import { calculateUserSummary } from '@/utils/taxTip';

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
    
    useEffect(() => {
        setToken(localStorage.getItem('token'));
        setMemberId(localStorage.getItem('memberId'));
    }, []);

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
                            ? { ...item, claimedBy: { id: payload.memberId }, locked: false }
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
                case 'OCR_ITEM_PARSED':
                    setItems(prev => [...prev, payload.item]);
                    break;
                case 'AGENT_ACTION':
                    setItems(prev => prev.map(item => {
                        if (item.id !== payload.itemId) return item;
                        return payload.action === 'CLAIMED'
                            ? { ...item, claimedBy: { id: payload.memberId }, locked: false }
                            : { ...item, claimedBy: null, locked: false };
                    }));
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

    const summary = calculateUserSummary(items, memberId ?? '', tax, tip);

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
        />
    );
}