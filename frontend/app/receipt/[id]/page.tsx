import { use } from 'react';
import ReceiptPage from '@/components/organisms/ReceiptPage';

interface ReceiptPageProps {
  params: Promise<{ id: string }>;
}

export default function Home({ params }: ReceiptPageProps) {
  const resolvedParams = use(params);
  return (
    <ReceiptPage sessionId={resolvedParams.id} />
  );
}
