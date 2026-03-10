interface ItemsSummaryContainerProps {
    displayName: string;
    claimedItemsCount: number;
    subtotal: number;
    tax: number;
    tip: number;
    total: number;
    onReadyClick?: () => void;
    readyLabel?: string;
    className?: string;
    isReady?: boolean;
}

export default function ItemsSummaryContainer({
    displayName,
    claimedItemsCount,
    subtotal,
    tax,
    tip,
    total,
    onReadyClick,
    readyLabel = 'Ready',
    className = '',
    isReady = false,
}: ItemsSummaryContainerProps) {
    return (
        <div className={`w-full rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-800 p-4 text-white shadow-xl sm:p-6 ${className}`}>
            <div className="flex h-full min-h-0 flex-col">
                <div>
                    <h2 className="text-lg font-bold sm:text-xl">{displayName}'s Items Summary</h2>
                    <div className="mt-3 h-px w-full bg-emerald-400/50" />
                </div>

                <div className="mt-5 space-y-4 text-sm sm:text-base">
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-emerald-100">Claimed Items</span>
                        <span className="font-semibold">{claimedItemsCount}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-emerald-100">Subtotal</span>
                        <span className="font-semibold">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-emerald-100">Tax</span>
                        <span className="font-semibold">${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-emerald-100">Tip</span>
                        <span className="font-semibold">${tip.toFixed(2)}</span>
                    </div>
                </div>

                <div className="mt-auto pt-6">
                    <div className="flex items-center justify-between gap-3 border-t border-emerald-400/50 pt-4">
                        <span className="text-base font-bold sm:text-lg">Total</span>
                        <span className="text-base font-bold sm:text-lg">${total.toFixed(2)}</span>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            console.log('button clicked');
                            onReadyClick?.();
                        }}
                        disabled={isReady}
                        className={`mt-4 w-full rounded-lg px-4 py-3 text-sm font-bold shadow-lg transition sm:text-base ${
                            isReady
                                ? 'bg-emerald-300 text-emerald-800 cursor-not-allowed'
                                : 'bg-white text-emerald-700 hover:bg-emerald-50 hover:scale-[1.02] active:scale-[0.98]'
                        }`}
                    >
                        {isReady ? 'Waiting for others...' : readyLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}