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
    isReady: boolean;
    onReady: () => void;
    agentClaimedItems: Set<string>;
}

export default function ReceiptPage({ sessionId, items, currentMemberId, sessionMembers, totalTax, totalTip, isItemsLoading, qrCodeUrl, isReady, onReady, agentClaimedItems }: ReceiptPageProps) {
    const router = useRouter();

    const memberVisualsById = buildMemberVisualsById(sessionMembers);
    const currentMember = sessionMembers.find(m => m.id === currentMemberId);
    const currentMemberDisplayName = currentMember?.displayName ?? 'You';

    const summary = useMemo(() => {
        const userItems = items.filter(item => item.claimedBy?.id === currentMemberId);
        const claimedItemsCount = userItems.length;
        const userSubtotal = userItems.reduce((sum, item) => sum + item.price, 0);
        const totalSubtotal = items.reduce((sum, item) => sum + item.price, 0);
        const proportion = totalSubtotal > 0 ? userSubtotal / totalSubtotal : 0;
        const userTaxShare = totalTax * proportion;
        const userTipShare = totalTip * proportion;
        const userTotal = userSubtotal + userTaxShare + userTipShare;

        if (process.env.NODE_ENV !== 'production') {
            console.debug('[ReceiptPage] 💰 Summary recalculated:', {
                currentMemberId,
                claimedItemsCount,
                userSubtotal,
                totalSubtotal,
                proportion,
                userTaxShare,
                userTipShare,
                userTotal,
                totalTax,
                totalTip,
                itemsCount: items.length,
            });
        }

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
                            isItemsLoading={isItemsLoading}
                            agentClaimedItems={agentClaimedItems}
                        />
                    </div>
                    <div className="hidden min-h-0 flex-col lg:flex lg:basis-1/3 lg:pl-2">
                        <ItemsSummaryContainer
                            displayName={currentMemberDisplayName}
                            claimedItemsCount={summary.claimedItemsCount}
                            subtotal={summary.subtotal}
                            tax={summary.tax}
                            tip={summary.tip}
                            total={summary.total}
                            onReadyClick={onReady}
                            isReady={isReady}
                            className="h-full"
                        />
                    </div>
                </div>

                <div className="fixed inset-x-0 bottom-0 z-20 p-3 lg:hidden">
                    <ItemsSummaryContainer
                        displayName={currentMemberDisplayName}
                        claimedItemsCount={summary.claimedItemsCount}
                        subtotal={summary.subtotal}
                        tax={summary.tax}
                        tip={summary.tip}
                        total={summary.total}
                        onReadyClick={onReady}
                        isReady={isReady}
                        className="h-full"
                    />
                </div>
            </main>
        </div>
    );
}