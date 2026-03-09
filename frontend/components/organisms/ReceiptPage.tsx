'use client';

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
    ocrLoading: boolean;
    summary: {
        claimedItemsCount: number;
        subtotal: number;
        taxShare: number;
        tipShare: number;
        total: number;
    };
}

export default function ReceiptPage({ sessionId, items, currentMemberId, sessionMembers, ocrLoading, summary }: ReceiptPageProps) {
    const router = useRouter();

    const handleReady = () => {
        router.push(`/summary/${sessionId}`);
    };

    const memberVisualsById = buildMemberVisualsById(sessionMembers);

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
                        {ocrLoading && items.length === 0 && (
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