import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({ message: 'تم تسجيل الخروج بنجاح', clearStorage: true });
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}
