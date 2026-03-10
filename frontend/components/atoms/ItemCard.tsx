'use client';

import { useState } from 'react';
import ClaimButton from '@/components/atoms/ClaimButton';
import client from '@/lib/graphql-request';
import { CLAIM_ITEM, RELEASE_ITEM } from '@/lib/mutations';
import { Item, MemberVisual } from '@/types/receipt';

interface ItemCardProps {
    item: Item;
    memberVisualsById: Record<string, MemberVisual>;
    currentMemberId: string;
    sessionId: string;
    isAgentClaimed: boolean;
}

export default function ItemCard({ item, memberVisualsById, currentMemberId, sessionId, isAgentClaimed }: ItemCardProps) {
    const [isLoading, setIsLoading] = useState(false);

    const claimed = Boolean(item.claimedBy);
    const claimedByCurrentUser = item.claimedBy?.id === currentMemberId;

    const claimedMemberVisual = item.claimedBy ? memberVisualsById[item.claimedBy.id] : undefined;
    const fallbackInitials = item.claimedBy?.id ? item.claimedBy.id.slice(0, 2).toUpperCase() : '';
    const claimedByInitials = claimedMemberVisual?.initials ?? fallbackInitials;
    const userColor = claimedMemberVisual?.colorClass ?? 'bg-slate-500';

    const handleClick = async () => {
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
        <div className={`w-full rounded-xl border-2 bg-white px-4 py-3 shadow-sm transition hover:shadow-md ${
            isAgentClaimed
                ? 'border-blue-300 bg-blue-50 hover:border-blue-400'
                : 'border-emerald-200 hover:border-emerald-400'
        }`}>
            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="truncate text-base font-semibold text-slate-900 sm:text-lg">
                            {item.name}
                        </h3>
                        {isAgentClaimed && (
                            <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                Auto-Claimed
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-sm font-medium text-emerald-600 sm:text-base">
                        ${item.price.toFixed(2)}
                    </p>
                </div>

                <div className="w-12 shrink-0 sm:w-14 md:w-16">
                    <ClaimButton
                        claimed={claimed}
                        claimedBy={claimedByInitials}
                        userColor={isAgentClaimed ? 'bg-blue-500' : userColor}
                        isLoading={isLoading || item.locked}
                        onClick={handleClick}
                    />
                </div>
            </div>
        </div>
    );
}