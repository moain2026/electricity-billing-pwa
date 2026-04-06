import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { calculateInvoice, numberToArabicWords } from '@/lib/invoice-utils';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const data = await request.json();
    const {
      previousReading = 0,
      currentReading = 0,
      unitPrice = 0,
      servicesAmount = 0,
      arrearsAmount = 0,
      paidDuringPeriod = 0,
      currency = 'ريال',
    } = data;

    const calc = calculateInvoice({
      previousReading,
      currentReading,
      unitPrice,
      servicesAmount,
      arrearsAmount,
      paidDuringPeriod,
    });

    return NextResponse.json({
      ...calc,
      netDueWords: numberToArabicWords(calc.netDue, currency),
    });
  } catch (error) {
    console.error('Calculate error:', error);
    return NextResponse.json({ error: 'خطأ في الحساب' }, { status: 500 });
  }
}
