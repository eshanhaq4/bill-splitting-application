'use client';
import AppHeader from '@/components/atoms/AppHeader';
import JoinContainer from '@/components/molecules/JoinContainer';

interface JoinPageProps {
    params: Promise<{ id: string }>;
}

export default function JoinPage({ params }: JoinPageProps) {
    return (
        <div className="flex min-h-screen w-full flex-col">
            <AppHeader />
            <main className="flex flex-1 items-center justify-center px-4 py-4 sm:px-6 sm:py-6">
                <div className="mx-auto flex w-full max-w-7xl items-center justify-center">
                    <JoinContainer />
                </div>
            </main>
        </div>
    );
}