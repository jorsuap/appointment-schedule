import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Check for the session cookie directly
  // NextAuth v5 uses __Secure-authjs.session-token in production (HTTPS)
  // and authjs.session-token in development (HTTP)
  const sessionCookie =
    request.cookies.get('__Secure-authjs.session-token') ||
    request.cookies.get('authjs.session-token') ||
    request.cookies.get('next-auth.session-token') ||
    request.cookies.get('__Secure-next-auth.session-token');

  if (!sessionCookie?.value) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/profesional/:path*'],
};
