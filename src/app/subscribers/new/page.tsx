import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import AppShell from '@/components/AppShell';
import NewSubscriberForm from '@/components/NewSubscriberForm';

export const dynamic = 'force-dynamic';

export default async function NewSubscriberPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <AppShell user={user}>
      <NewSubscriberForm />
    </AppShell>
  );
}
