'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useWebSocket } from '@/hooks/useWebSocket';
import ReceiptPage from '@/components/organisms/ReceiptPage';
import client from '@/lib/graphql-request';
import { GET_SESSION } from '@/lib/mutations';
import { Item, Member } from '@/types/receipt';

export default function ReceiptRoute() {
    const params = useParams();
    console.log(params);
    const sessionId = params?.id as string;
    const [token, setToken] = useState<string | null>(null);
    const [memberId, setMemberId] = useState<string | null>(null);
    const [items, setItems] = useState<Item[]>([]);
    const [sessionMembers, setSessionMembers] = useState<Member[]>([]);  
    
    useEffect(() => {
        setToken(localStorage.getItem('token'));
        setMemberId(localStorage.getItem('memberId'));
    }, []);

    useEffect(() => {
        if (!sessionId) return;

        client.request(GET_SESSION, { id: sessionId }).then((data: any) => {
            const { items, members } = data.session;
            setItems(items);
            setSessionMembers(members);
        });
    }, [sessionId]);

    useWebSocket(sessionId, token, (event, payload) => {
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
    });

    return (
        <ReceiptPage
            sessionId={sessionId}
            items={items}
            currentMemberId={memberId ?? ''}
            sessionMembers={sessionMembers}
        />
    );
}