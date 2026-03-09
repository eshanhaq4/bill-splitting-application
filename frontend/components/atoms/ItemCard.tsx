'use client';

import { useState } from 'react';
import ClaimButton from '@/components/atoms/ClaimButton';
import client from '@/lib/graphql-request';
import { CLAIM_ITEM, RELEASE_ITEM } from '@/lib/mutations';
import { Item, MemberVisual } from '@/types/receipt';

interface ItemCardProps {
    item: Item;
    memberVisualsById: Record<string, MemberVisual>;
    // Pass these in from the parent (stored in localStorage after create/join)
    currentMemberId: string;
    sessionId: string;
}

export default function ItemCard({ item, memberVisualsById, currentMemberId, sessionId }: ItemCardProps) {
    const [isLoading, setIsLoading] = useState(false);

    const claimed = Boolean(item.claimedBy);
    const claimedByCurrentUser = item.claimedBy?.id === currentMemberId;

    const claimedMemberVisual = item.claimedBy ? memberVisualsById[item.claimedBy.id] : undefined;
    const claimedByInitials = claimedMemberVisual?.initials ?? '';
    const userColor = claimedMemberVisual?.colorClass ?? 'bg-emerald-500';

    const handleClick = async () => {
        // Only the current user can release their own claim., anyone can claim an unclaimed item.
        if (claimed && !claimedByCurrentUser) return;

        setIsLoading(true);

        try {
            if (claimedByCurrentUser) {
                const data: any = await client.request(RELEASE_ITEM, {
                    itemId: item.id,
                    userId: currentMemberId,
                });

                const { errorCode, message } = data.releaseItem;
                if (errorCode) {
                    console.error('Release failed:', message);
                }
            } else {
                const data: any = await client.request(CLAIM_ITEM, {
                    itemId: item.id,
                    userId: currentMemberId,
                });

                const { errorCode, message } = data.claimItem;
                if (errorCode) {
                    // ITEM_ALREADY_CLAIMED error
                    console.error('Claim failed:', errorCode, message);
                }
            }
        } catch (err) {
            console.error('Mutation error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full rounded-xl border-2 border-emerald-200 bg-white px-4 py-3 shadow-sm transition hover:border-emerald-400 hover:shadow-md">
            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-slate-900 sm:text-lg">
                        {item.name}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-emerald-600 sm:text-base">
                        ${item.price.toFixed(2)}
                    </p>
                </div>

                <div className="w-12 shrink-0 sm:w-14 md:w-16">
                    <ClaimButton
                        claimed={claimed}
                        claimedBy={claimedByInitials}
                        userColor={userColor}
                        isLoading={isLoading || item.locked}
                        onClick={handleClick}
                    />
                </div>
            </div>
        </div>
    );
}