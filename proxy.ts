import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const userRole = request.cookies.get('userRole')?.value;
  const path = request.nextUrl.pathname;

  // Define route prefixes
  const isAdminRoute = path.startsWith('/Admin');
  const isSuperuserRoute = path.startsWith('/Superuser');
  const isSupervisorRoute = path.startsWith('/Supervisor');

  // If trying to access a protected route without a token
  if (!token && (isAdminRoute || isSuperuserRoute || isSupervisorRoute)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role gating based on the cookie
  // Note: This is purely for UI routing. Authoritative validation happens in the backend API.
  if (isAdminRoute && userRole !== 'Admin' && userRole !== 'SuperAdmin') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isSuperuserRoute && userRole !== 'Superuser' && userRole !== 'Admin' && userRole !== 'SuperAdmin') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isSupervisorRoute && userRole !== 'Supervisor' && userRole !== 'Superuser' && userRole !== 'Admin' && userRole !== 'SuperAdmin') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/Admin/:path*', '/Superuser/:path*', '/Supervisor/:path*'],
};
