import ItemCard from '@/components/atoms/ItemCard';
import { Item, MemberVisual } from '@/types/receipt';

interface ItemsContainerProps {
    items: Item[];
    memberVisualsById: Record<string, MemberVisual>;
    currentMemberId: string;
    sessionId: string;
}

export default function ItemsContainer({ items, memberVisualsById, currentMemberId, sessionId }) {
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