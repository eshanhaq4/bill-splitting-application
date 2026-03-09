'use client';

import { useRouter } from 'next/navigation';
import HomeDescription from '@/components/atoms/HomeDescription';
import AppHeader from '@/components/atoms/AppHeader';
import CreateContainer from '@/components/molecules/CreateContainer';

export default function HomePage() {
  const router = useRouter();

  const handleCreateSession = (payload: { name: string; receiptFile: File | null }) => {
    const mockSessionId = 'session-' + Math.random().toString(36).substring(2, 11);
    router.push(`/receipt/${mockSessionId}`);
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 lg:flex-row lg:items-center lg:gap-10">
          <div className="w-full lg:w-1/2">
            <HomeDescription />
          </div>

          <div className="w-full lg:w-1/2">
            <CreateContainer onCreateSession={handleCreateSession} />
          </div>
        </div>
      </main>
    </div>
  );
}
