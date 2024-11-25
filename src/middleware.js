import { NextResponse } from 'next/server';
import { jwtUtils } from './lib/jwt';

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Get token from cookies
  const token = req.cookies.get('token')?.value;

  // Define protected routes
  const protectedRoutes = ['/dashboard', '/profile', '/settings', '/manage-users'];
  const authRoute = '/auth';

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = pathname === authRoute;

  // Verify token and get user data
  const userData = token ? jwtUtils.verifyToken(token) : null;

  // If the route is protected and there's no valid token, redirect to auth page
  if (isProtectedRoute && !userData) {
    const redirectUrl = new URL('/auth', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is logged in and tries to access auth page, redirect to dashboard
  if (isAuthRoute && userData) {
    const redirectUrl = new URL('/dashboard', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/settings/:path*', '/auth', '/manage-users/:path*'],
}; 