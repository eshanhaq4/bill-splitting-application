import ItemCard from '@/components/atoms/ItemCard';
import { Item, MemberVisual } from '@/types/receipt';

interface ItemsContainerProps {
    items: Item[];
    memberVisualsById: Record<string, MemberVisual>;
    currentMemberId: string;
    sessionId: string;
    isLoading: boolean;
}

export default function ItemsContainer({ items, memberVisualsById, currentMemberId, sessionId, isLoading }: ItemsContainerProps) {
    if (isLoading) {
        return (
            <div className="h-full min-h-0 w-full overflow-y-auto">
                <div className="flex flex-col gap-3 pr-1 pb-80 lg:pb-0">
                    {[...Array(8)].map((_, index) => (
                        <div
                            key={`item-skeleton-${index}`}
                            className="w-full animate-pulse rounded-xl border-2 border-emerald-200 bg-white px-4 py-3 shadow-sm"
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <div className="h-5 w-3/5 rounded bg-emerald-100" />
                                    <div className="mt-2 h-4 w-1/4 rounded bg-emerald-100" />
                                </div>
                                <div className="h-10 w-10 shrink-0 rounded-full bg-emerald-100 sm:h-12 sm:w-12" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full min-h-0 w-full overflow-y-auto">
            <div className="flex flex-col gap-3 pr-1 pb-80 lg:pb-0">
                {items.map((item, index) => (
                    <ItemCard
                        key={`${item.id}-${index}`}
                        item={item}
                        memberVisualsById={memberVisualsById}
                        currentMemberId={currentMemberId} 
                        sessionId={sessionId} 
                    />
                ))}
            </div>
        </div>
    );
}