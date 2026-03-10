'use client';

import { useEffect, useState } from 'react';
import AppHeader from '@/components/atoms/AppHeader';
import SummaryDescription from '@/components/atoms/SummaryDescription';
import FinalSummaryContainer from '@/components/molecules/FinalSummaryContainer';
import client from '@/lib/graphql-request';
import { GET_SESSION } from '@/lib/mutations';
import { Item, Member } from '@/types/receipt';

interface SummaryPageProps {
    sessionId: string;
}

interface FinalSummaryRow {
    memberId: string;
    memberName: string;
    claimedItemsCount: number;
    subtotal: number;
    tax: number;
    tip: number;
    total: number;
}

export default function SummaryPage({ sessionId }: SummaryPageProps) {
    const [finalSnapshot, setFinalSnapshot] = useState<FinalSummaryRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!sessionId) return;

        setLoading(true);
        client
            .request(GET_SESSION, { id: sessionId })
            .then((data: any) => {
                const { items, members, tax: totalTax, tip: totalTip } = data.session;

                // Calculate total subtotal from all items
                const totalSubtotal = (items as Item[]).reduce((sum: number, item) => sum + item.price, 0);

                // Calculate each member's final totals
                const rows: FinalSummaryRow[] = (members as Member[]).map((member) => {
                    // Get all items claimed by this member
                    const memberItems = items.filter((item: Item) => item.claimedBy?.id === member.id);
                    const claimedItemsCount = memberItems.length;

                    // Calculate member's subtotal
                    const memberSubtotal = memberItems.reduce((sum: number, item: Item) => sum + item.price, 0);

                    // Calculate proportional tax and tip shares
                    const proportion = totalSubtotal > 0 ? memberSubtotal / totalSubtotal : 0;
                    const memberTaxShare = (totalTax ?? 0) * proportion;
                    const memberTipShare = (totalTip ?? 0) * proportion;

                    // Calculate member's total
                    const memberTotal = memberSubtotal + memberTaxShare + memberTipShare;

                    return {
                        memberId: member.id,
                        memberName: member.displayName,
                        claimedItemsCount,
                        subtotal: memberSubtotal,
                        tax: memberTaxShare,
                        tip: memberTipShare,
                        total: memberTotal,
                    };
                });

                // Calculate unclaimed items row
                const unclaimedItems = (items as Item[]).filter((item) => !item.claimedBy);
                const unclaimedItemsCount = unclaimedItems.length;

                if (unclaimedItemsCount > 0) {
                    // Calculate unclaimed subtotal
                    const unclaimedSubtotal = unclaimedItems.reduce((sum: number, item: Item) => sum + item.price, 0);

                    // Calculate proportional tax and tip shares for unclaimed items
                    const unclaimedProportion = totalSubtotal > 0 ? unclaimedSubtotal / totalSubtotal : 0;
                    const unclaimedTaxShare = (totalTax ?? 0) * unclaimedProportion;
                    const unclaimedTipShare = (totalTip ?? 0) * unclaimedProportion;
                    const unclaimedTotal = unclaimedSubtotal + unclaimedTaxShare + unclaimedTipShare;

                    // Add unclaimed row at the end
                    rows.push({
                        memberId: 'unclaimed',
                        memberName: 'Unclaimed',
                        claimedItemsCount: unclaimedItemsCount,
                        subtotal: unclaimedSubtotal,
                        tax: unclaimedTaxShare,
                        tip: unclaimedTipShare,
                        total: unclaimedTotal,
                    });
                }

                setFinalSnapshot(rows);
            })
            .catch((error) => {
                console.error('Failed to load session data:', error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [sessionId]);

    return (
        <div className="flex min-h-screen w-full flex-col">
            <AppHeader />
            <main className="flex flex-1 items-center justify-center px-4 py-4 sm:px-6 sm:py-6">
                <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-6">
                    <SummaryDescription />
                    <FinalSummaryContainer rows={finalSnapshot} />
                </div>
            </main>
        </div>
    );
}
        