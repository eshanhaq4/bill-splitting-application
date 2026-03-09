'use client';

import { useRouter } from 'next/navigation';
import ReceiptHeader, { ReceiptMemberPresence } from '@/components/atoms/ReceiptHeader';
import ReceiptContainer from '@/components/molecules/ReceiptContainer';
import ItemsSummaryContainer from '@/components/molecules/ItemsSummaryContainer';
import { Item, Member } from '@/types/receipt';
import { buildMemberVisualsById } from '@/utils/memberVisuals';

interface ReceiptPageProps {
    sessionId: string;
}

export default function ReceiptPage({ sessionId }: ReceiptPageProps) {
    const router = useRouter();

    const handleReady = () => {
        router.push(`/summary/${sessionId}`);
    };

    const sessionMembers: Member[] = [
        { id: '1', displayName: 'Joanna Carter', connected: true },
        { id: '2', displayName: 'Ade Martins', connected: true },
        { id: '3', displayName: 'Chris Park', connected: false },
    ];
    const memberVisualsById = buildMemberVisualsById(sessionMembers);

    // mock data, will be replaced by api call results and websocket updates in the future
    const items: Item[] = [
        { id: '1', name: 'Burger', price: 15, category: 'Entree', claimedBy: sessionMembers[0], locked: false },
        { id: '2', name: 'Fries', price: 6, category: 'Side', claimedBy: null, locked: false },
        { id: '3', name: 'Soda', price: 4, category: 'Drink', claimedBy: sessionMembers[1], locked: false },
        { id: '4', name: 'Salad', price: 11, category: 'Entree', claimedBy: null, locked: true },
        { id: '5', name: 'Pasta', price: 18, category: 'Entree', claimedBy: sessionMembers[2], locked: false },
        { id: '6', name: 'Ice Tea', price: 5, category: 'Drink', claimedBy: null, locked: false },
        { id: '7', name: 'Pizza Slice', price: 7, category: 'Entree', claimedBy: sessionMembers[0], locked: false },
        { id: '8', name: 'Cheesecake', price: 8, category: 'Dessert', claimedBy: null, locked: false },
        { id: '9', name: 'Wings', price: 12, category: 'Appetizer', claimedBy: sessionMembers[1], locked: false },
        { id: '10', name: 'Lemonade', price: 4, category: 'Drink', claimedBy: null, locked: true },
    ];
    const members: ReceiptMemberPresence[] = sessionMembers.map((member) => ({
        id: member.id,
        initials: memberVisualsById[member.id]?.initials ?? '??',
        colorClass: memberVisualsById[member.id]?.colorClass ?? 'bg-emerald-500',
        isConnected: member.connected,
    }));
    const claimedItemsCount = 3;
    const subtotal = 25;
    const tax = 2.06;
    const total = subtotal + tax;
    const qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=http://localhost:3000/join/session-123';

    return (
        <div className="flex h-screen w-full flex-col">
            <ReceiptHeader members={members} qrCodeUrl={qrCodeUrl} />
            <main className="flex min-h-0 flex-1 overflow-hidden p-3 sm:p-4">
                <div className="mx-auto flex h-full w-full max-w-7xl gap-4">
                    <div className="flex min-h-0 w-full flex-col lg:basis-2/3 lg:pr-2">
                        <ReceiptContainer items={items} memberVisualsById={memberVisualsById} />
                    </div>

                    <div className="hidden min-h-0 flex-col lg:flex lg:basis-1/3 lg:pl-2">
                        <ItemsSummaryContainer
                            claimedItemsCount={claimedItemsCount}
                            subtotal={subtotal}
                            tax={tax}
                            total={total}
                            onReadyClick={handleReady}
                            className="h-full"
                        />
                    </div>
                </div>

                <div className="fixed inset-x-0 bottom-0 z-20 p-3 lg:hidden">
                    <ItemsSummaryContainer
                        claimedItemsCount={claimedItemsCount}
                        subtotal={subtotal}
                        tax={tax}
                        total={total}
                        onReadyClick={handleReady}
                    />
                </div>
            </main>
        </div>
    );
}