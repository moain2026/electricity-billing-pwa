import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import AppShell from '@/components/AppShell';
import InvoiceForm from '@/components/InvoiceForm';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default async function NewInvoicePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <AppShell user={user}>
      <Suspense fallback={<div className="text-center p-8">جاري التحميل...</div>}>
        <InvoiceForm />
      </Suspense>
    </AppShell>
  );
}
