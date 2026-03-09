import AppHeader from '@/components/atoms/AppHeader';
import SummaryDescription from '@/components/atoms/SummaryDescription';
import FinalSummaryContainer from '@/components/molecules/FinalSummaryContainer';

interface SummaryPageProps {
    sessionId: string;
}

export default function SummaryPage({ sessionId }: SummaryPageProps) {
    // mock data for final summary, replace with api call result in the future
    const finalSnapshot = [
        { memberId: '1', memberName: 'Joanna', claimedItemsCount: 2, totalPrice: 19.50 },
        { memberId: '2', memberName: 'Chris', claimedItemsCount: 1, totalPrice: 12.75 },
        { memberId: '3', memberName: 'Ade', claimedItemsCount: 3, totalPrice: 27.10 },
    ];

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
        