'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useWebSocket } from '@/hooks/useWebSocket';
import ReceiptPage from '@/components/organisms/ReceiptPage';
import client from '@/lib/graphql-request';
import { GET_SESSION } from '@/lib/mutations';
import { Item, Member } from '@/types/receipt';
import { calculateUserSummary } from '@/utils/taxTip';

export default function ReceiptRoute() {
    const params = useParams();
    const sessionId = params?.id as string;
    const [token, setToken] = useState<string | null>(null);
    const [memberId, setMemberId] = useState<string | null>(null);
    const [items, setItems] = useState<Item[]>([]);
    const [sessionMembers, setSessionMembers] = useState<Member[]>([]);
    const [ocrLoading, setOcrLoading] = useState(false);
    const [tax, setTax] = useState(0);
    const [tip, setTip] = useState(0);

    useEffect(() => {
        setToken(localStorage.getItem('token'));
        setMemberId(localStorage.getItem('memberId'));
    }, []);

    useEffect(() => {
        if (!sessionId) return;

        client.request(GET_SESSION, { id: sessionId }).then((data: any) => {
            const { items, members, tax, tip } = data.session;
            setItems(items);
            setSessionMembers(members);
            setTax(tax ?? 0);
            setTip(tip ?? 0);
            if (items.length === 0) setOcrLoading(true);
        });
    }, [sessionId]);

    useWebSocket(sessionId, token, (event, payload) => {
        switch (event) {
            case 'ITEM_CLAIMED':
                setItems(prev => prev.map(item =>
                    item.id === payload.item_id
                        ? { ...item, claimedBy: { id: payload.claimed_by }, locked: false }
                        : item
                ));
                break;
            case 'ITEM_RELEASED':
                setItems(prev => prev.map(item =>
                    item.id === payload.item_id
                        ? { ...item, claimedBy: null, locked: false }
                        : item
                ));
                break;
            case 'ITEM_LOCKED':
                setItems(prev => prev.map(item =>
                    item.id === payload.item_id ? { ...item, locked: true } : item
                ));
                break;
            case 'ITEM_UNLOCKED':
                setItems(prev => prev.map(item =>
                    item.id === payload.item_id ? { ...item, locked: false } : item
                ));
                break;
            case 'OCR_ITEM_PARSED':
                setOcrLoading(false);
                setItems(prev => [...prev, payload.item]);
                break;
            case 'AGENT_ACTION':
                setItems(prev => prev.map(item => {
                    if (item.id !== payload.item_id) return item;
                    return payload.action === 'CLAIMED'
                        ? { ...item, claimedBy: { id: payload.claimed_by }, locked: false }
                        : { ...item, claimedBy: null, locked: false };
                }));
                break;
        }
    });

    const summary = calculateUserSummary(items, memberId ?? '', tax, tip);

    return (
        <ReceiptPage
            sessionId={sessionId}
            items={items}
            currentMemberId={memberId ?? ''}
            sessionMembers={sessionMembers}
            ocrLoading={ocrLoading}
            summary={summary}
        />
    );
}