import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const settings = await prisma.setting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => { settingsMap[s.key] = s.value; });

    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });
    }

    const data = await request.json();

    for (const [key, value] of Object.entries(data)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        entityType: 'settings',
        entityId: 'global',
        action: 'update',
        newValues: JSON.stringify(data),
      },
    });

    return NextResponse.json({ message: 'تم حفظ الإعدادات بنجاح' });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}
