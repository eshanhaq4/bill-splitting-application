import { use } from 'react';
import SummaryPage from '@/components/organisms/SummaryPage';

interface SummaryPageProps {
  params: Promise<{ id: string }>;
}

export default function Summary({ params }: SummaryPageProps) {
  const resolvedParams = use(params);
  return (
    <SummaryPage sessionId={resolvedParams.id} />
  );
}
