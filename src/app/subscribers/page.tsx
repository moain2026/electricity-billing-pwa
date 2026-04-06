import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import AppShell from '@/components/AppShell';
import SubscribersList from '@/components/SubscribersList';

export const dynamic = 'force-dynamic';

export default async function SubscribersPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <AppShell user={user}>
      <SubscribersList />
    </AppShell>
  );
}
