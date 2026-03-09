import ClaimButton from '@/components/atoms/ClaimButton';
import { Item, MemberVisual } from '@/types/receipt';

interface ItemCardProps {
    item: Item;
    memberVisualsById: Record<string, MemberVisual>;
}

export default function ItemCard({ item, memberVisualsById }: ItemCardProps) {
    const claimed = Boolean(item.claimedBy);
    const claimedMemberVisual = item.claimedBy ? memberVisualsById[item.claimedBy.id] : undefined;
    const claimedByInitials = claimedMemberVisual?.initials ?? '';
    const userColor = claimedMemberVisual?.colorClass ?? 'bg-emerald-500';

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
                        isLoading={item.locked}
                    />
                </div>
            </div>
        </div>
    );
}