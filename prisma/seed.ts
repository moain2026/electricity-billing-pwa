// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      fullName: 'مدير النظام',
      username: 'admin',
      passwordHash: adminPassword,
      role: 'admin',
      isActive: true,
    },
  });

  // Create clerk user
  const clerkPassword = await bcrypt.hash('clerk123', 10);
  const clerk = await prisma.user.upsert({
    where: { username: 'clerk' },
    update: {},
    create: {
      fullName: 'موظف الفوترة',
      username: 'clerk',
      passwordHash: clerkPassword,
      role: 'clerk',
      isActive: true,
    },
  });

  // Create default settings
  const settings = [
    { key: 'organization_name', value: 'محطة كهرباء الصبالية' },
    { key: 'currency', value: 'ريال' },
    { key: 'default_unit_price', value: '220' },
    { key: 'footer_note', value: 'ملاحظة: المحطة غير مسؤولة عن تسليم أي مبلغ بدون سند رسمي' },
    { key: 'invoice_title', value: 'فاتورة استهلاك كهرباء' },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  // Create sample subscribers
  const subscribers = [
    {
      subscriberNumber: '68201348',
      subscriberName: 'موقع ام تي ان خط الجامعة / موقع 68201348',
      meterNumber: '87164754',
      routeNumber: '13480',
      cabinName: 'الصبالية',
      locationName: 'خط الجامعة',
    },
    {
      subscriberNumber: '68201500',
      subscriberName: 'مسجد الرحمة',
      meterNumber: '87164800',
      routeNumber: '13481',
      cabinName: 'الصبالية',
      locationName: 'شارع المسجد',
    },
    {
      subscriberNumber: '68201601',
      subscriberName: 'مدرسة النور الأساسية',
      meterNumber: '87164900',
      routeNumber: '13482',
      cabinName: 'الصبالية',
      locationName: 'حي النور',
    },
  ];

  for (const sub of subscribers) {
    await prisma.subscriber.upsert({
      where: { subscriberNumber: sub.subscriberNumber },
      update: {},
      create: sub,
    });
  }

  // Create a sample invoice for the first subscriber
  const sub1 = await prisma.subscriber.findUnique({
    where: { subscriberNumber: '68201348' },
  });

  if (sub1) {
    const existing = await prisma.invoice.findFirst({
      where: { subscriberId: sub1.id, periodFrom: '2026/03/01' },
    });
    if (!existing) {
      await prisma.invoice.create({
        data: {
          invoiceNumber: 'INV-2026-03-0001',
          subscriberId: sub1.id,
          periodFrom: '2026/03/01',
          periodTo: '2026/03/31',
          previousReading: 24149,
          currentReading: 25254,
          consumptionKwh: 1105,
          unitPrice: 220,
          baseValue: 243100,
          servicesAmount: 0,
          arrearsAmount: 0,
          paidDuringPeriod: 0,
          grossAmount: 243100,
          netDue: 243100,
          netDueWords: 'مائتان وثلاثة وأربعون ألفاً ومائة ريال فقط لا غير',
          currency: 'ريال',
          status: 'issued',
          issuedById: admin.id,
          issuedAt: new Date(),
        },
      });
    }
  }

  console.log('Seed data created successfully!');
  console.log('Admin user: admin / admin123');
  console.log('Clerk user: clerk / clerk123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
