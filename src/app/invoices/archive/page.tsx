import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import AppShell from '@/components/AppShell';
import InvoiceArchive from '@/components/InvoiceArchive';

export const dynamic = 'force-dynamic';

export default async function ArchivePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <AppShell user={user}>
      <InvoiceArchive />
    </AppShell>
  );
}
