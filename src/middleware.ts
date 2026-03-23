import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

export default auth((request) => {
    const session = request.auth;
    const { pathname } = request.nextUrl;

    const isAuthPage = pathname.startsWith('/auth');
    const isAdminPage = pathname.startsWith('/admin');
    const isDashboardPage = pathname.startsWith('/dashboard');
    const isPublicPage = pathname.startsWith('/portal');

    if (isPublicPage) return NextResponse.next();

    if (!session) {
        if (isAdminPage || isDashboardPage) {
            return NextResponse.redirect(new URL('/auth/login', request.url));
        }
        return NextResponse.next();
    }

    const user = session.user as { role?: string; status?: string };

    // Redirect authenticated users away from auth pages
    if (isAuthPage) {
        if (user.role === 'admin') {
            return NextResponse.redirect(new URL('/admin', request.url));
        }
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Admin route protection
    if (isAdminPage && user.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Freelancer dashboard protection
    if (isDashboardPage) {
        if (user.role === 'admin') {
            return NextResponse.redirect(new URL('/admin', request.url));
        }
        if (user.status === 'pending') {
            return NextResponse.redirect(new URL('/auth/pending', request.url));
        }
        if (user.status === 'suspended') {
            return NextResponse.redirect(new URL('/auth/suspended', request.url));
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
