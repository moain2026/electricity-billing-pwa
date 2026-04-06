import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Pages that require authentication
const PROTECTED_PATHS = ['/dashboard', '/subscribers', '/invoices', '/settings'];

// Pages that should redirect to dashboard if already authenticated
const AUTH_PATHS = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for auth token in cookies
  const cookieToken = request.cookies.get('auth-token')?.value;
  
  // Check for auth token in Authorization header (from localStorage-based fallback)
  const headerToken = request.headers.get('authorization')?.replace('Bearer ', '');
  
  const token = cookieToken || headerToken;

  // If accessing a protected path without a token, redirect to login
  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p));
  if (isProtected && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If accessing login with a token, redirect to dashboard
  const isAuthPage = AUTH_PATHS.some(p => pathname === p);
  if (isAuthPage && token) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // If we have a header token but no cookie, set the cookie for server components
  if (headerToken && !cookieToken) {
    const response = NextResponse.next();
    response.cookies.set('auth-token', headerToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/subscribers/:path*',
    '/invoices/:path*',
    '/settings/:path*',
    '/login',
  ],
};
