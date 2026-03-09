import ItemsContainer from "@/components/molecules/ItemsContainer"
import { Item, MemberVisual } from '@/types/receipt';

interface ReceiptContainerProps {
    items: Item[];
    memberVisualsById: Record<string, MemberVisual>;
    currentMemberId: string;
    sessionId: string;
    isItemsLoading: boolean;
}
export default function ReceiptContainer({ items, memberVisualsById, currentMemberId, sessionId, isItemsLoading }: ReceiptContainerProps) {
    return (
        <div className="h-full min-h-0 w-full p-2 sm:p-3">
            <div className="flex h-full min-h-0 flex-col">
                <div className="pb-3">
                    <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Receipt Items</h2>
                    <div className="mt-3 h-px w-full bg-emerald-200" />
                </div>

                <div className="min-h-0 flex-1 pt-1">
                    <ItemsContainer
                        items={items}
                        memberVisualsById={memberVisualsById}
                        currentMemberId={currentMemberId}
                        sessionId={sessionId}
                        isLoading={isItemsLoading}
                    />
                </div>
            </div>
        </div>
    );
}