import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { id } = await params;
    const subscriber = await prisma.subscriber.findUnique({
      where: { id },
      include: {
        invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!subscriber) {
      return NextResponse.json({ error: 'المشترك غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ subscriber });
  } catch (error) {
    console.error('Subscriber GET error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { id } = await params;
    const data = await request.json();

    const existing = await prisma.subscriber.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'المشترك غير موجود' }, { status: 404 });
    }

    const subscriber = await prisma.subscriber.update({
      where: { id },
      data: {
        subscriberName: data.subscriberName,
        meterNumber: data.meterNumber,
        routeNumber: data.routeNumber,
        cabinName: data.cabinName,
        locationName: data.locationName || '',
        phone: data.phone || '',
        notes: data.notes || '',
        status: data.status || existing.status,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        entityType: 'subscriber',
        entityId: subscriber.id,
        action: 'update',
        oldValues: JSON.stringify(existing),
        newValues: JSON.stringify(subscriber),
      },
    });

    return NextResponse.json({ subscriber });
  } catch (error) {
    console.error('Subscriber PUT error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}
