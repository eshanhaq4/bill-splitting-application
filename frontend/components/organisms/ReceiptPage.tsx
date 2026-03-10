'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ReceiptHeader, { ReceiptMemberPresence } from '@/components/atoms/ReceiptHeader';
import ReceiptContainer from '@/components/molecules/ReceiptContainer';
import ItemsSummaryContainer from '@/components/molecules/ItemsSummaryContainer';
import { Item, Member } from '@/types/receipt';
import { buildMemberVisualsById } from '@/utils/memberVisuals';

interface ReceiptPageProps {
    sessionId: string;
    items: Item[];
    currentMemberId: string;
    sessionMembers: Member[];
    totalTax: number;
    totalTip: number;
    isItemsLoading: boolean;
    qrCodeUrl: string;
}

export default function ReceiptPage({ sessionId, items, currentMemberId, sessionMembers, totalTax, totalTip, isItemsLoading, qrCodeUrl }: ReceiptPageProps) {
    const router = useRouter();

    const handleReady = () => {
        router.push(`/summary/${sessionId}`);
    };

    const memberVisualsById = buildMemberVisualsById(sessionMembers);

    // Calculate user's claimed items summary based on RFC-7
    const summary = useMemo(() => {
        // Get all items claimed by current user
        const userItems = items.filter(item => item.claimedBy?.id === currentMemberId);
        const claimedItemsCount = userItems.length;
        // Calculate user's subtotal
        const userSubtotal = userItems.reduce((sum, item) => sum + item.price, 0);
        // Calculate total subtotal
        const totalSubtotal = items.reduce((sum, item) => sum + item.price, 0);
        // Calculate user's proportional share of tax and tip
        // If no items exist or user has no items, their share is 0
        const proportion = totalSubtotal > 0 ? userSubtotal / totalSubtotal : 0;
        const userTaxShare = totalTax * proportion;
        const userTipShare = totalTip * proportion;
        // Calculate user's total
        const userTotal = userSubtotal + userTaxShare + userTipShare;
        return {
            claimedItemsCount,
            subtotal: userSubtotal,
            tax: userTaxShare,
            tip: userTipShare,
            total: userTotal,
        };
    }, [items, currentMemberId, totalTax, totalTip]);

    const members: ReceiptMemberPresence[] = sessionMembers.map((member) => ({
        id: member.id,
        initials: memberVisualsById[member.id]?.initials ?? '??',
        colorClass: memberVisualsById[member.id]?.colorClass ?? 'bg-emerald-500',
        isConnected: member.connected,
    }));
   
    const qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=http://localhost:3000/join/session-123';

    return (
        <div className="flex h-screen w-full flex-col">
            <ReceiptHeader members={members} qrCodeUrl={qrCodeUrl} />
            <main className="flex min-h-0 flex-1 overflow-hidden p-3 sm:p-4">
                <div className="mx-auto flex h-full w-full max-w-7xl gap-4">
                    <div className="flex min-h-0 w-full flex-col lg:basis-2/3 lg:pr-2">
                        {isItemsLoading && (
                            <p className="text-sm text-slate-500 text-center mt-4">Parsing receipt...</p>
                        )}
                        <ReceiptContainer
                            items={items}
                            memberVisualsById={memberVisualsById}
                            currentMemberId={currentMemberId}
                            sessionId={sessionId}
                        />
                    </div>
                    <div className="hidden min-h-0 flex-col lg:flex lg:basis-1/3 lg:pl-2">
                        <ItemsSummaryContainer
                            claimedItemsCount={summary.claimedItemsCount}
                            subtotal={summary.subtotal}
                            tax={summary.taxShare}
                            total={summary.total}
                            onReadyClick={handleReady}
                            className="h-full"
                        />
                    </div>
                </div>

                <div className="fixed inset-x-0 bottom-0 z-20 p-3 lg:hidden">
                    <ItemsSummaryContainer
                        claimedItemsCount={summary.claimedItemsCount}
                        subtotal={summary.subtotal}
                        tax={summary.taxShare}
                        total={summary.total}
                        onReadyClick={handleReady}
                        className="h-full"
                    />
                </div>
            </main>
        </div>
    );
}