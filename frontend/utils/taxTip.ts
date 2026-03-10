import { Item } from '@/types/receipt';

export function calculateUserSummary(
    items: Item[],
    currentMemberId: string,
    totalTax: number,
    totalTip: number
) {
    const claimedItems = items.filter(item => item.claimedBy);
    const userItems = items.filter(item => item.claimedBy?.id === currentMemberId);

    const claimedSubtotal = claimedItems.reduce((sum, item) => sum + item.price, 0);
    const userSubtotal = userItems.reduce((sum, item) => sum + item.price, 0);

    const ratio = claimedSubtotal > 0 ? userSubtotal / claimedSubtotal : 0;

    return {
        claimedItemsCount: userItems.length,
        subtotal: userSubtotal,
        taxShare: totalTax * ratio,
        tipShare: totalTip * ratio,
        total: userSubtotal + (totalTax * ratio) + (totalTip * ratio),
    };
}