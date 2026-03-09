import { use } from 'react';
import JoinPage from '@/components/organisms/JoinPage';

interface JoinPageRouteProps {
  params: Promise<{ id: string }>;
}

export default function Join({ params }: JoinPageRouteProps) {
  const resolvedParams = use(params);
  return (
    <JoinPage params={Promise.resolve(resolvedParams)} />
  );
}
