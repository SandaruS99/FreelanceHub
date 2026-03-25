import type { NextAuthConfig, DefaultSession } from 'next-auth';
import type { JWT as NextAuthJWT } from 'next-auth/jwt';

// Extend types directly here for build reliability
declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            role?: string;
            status?: string;
            plan?: string;
            businessName?: string;
            phone?: string;
            currency?: string;
            timezone?: string;
            avatar?: string;
            userId?: string;
        } & DefaultSession['user']
    }

    interface User {
        id: string; // Must be mandatory to match DefaultSession
        role?: string;
        status?: string;
        plan?: string;
        businessName?: string;
        phone?: string;
        currency?: string;
        timezone?: string;
        avatar?: string;
        userId?: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        role?: string;
        status?: string;
        plan?: string;
        businessName?: string;
        phone?: string;
        currency?: string;
        timezone?: string;
        avatar?: string;
        userId?: string;
    }
}

export const authConfig = {
    providers: [],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.status = user.status;
                token.plan = user.plan;
                token.businessName = user.businessName;
                token.phone = user.phone;
                token.currency = user.currency;
                token.timezone = user.timezone;
                token.avatar = user.avatar;
                token.userId = user.userId;
            }
            // Allow session.update() to refresh token fields
            if (trigger === 'update' && session) {
                return { ...token, ...session };
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.status = token.status;
                session.user.plan = token.plan;
                session.user.businessName = token.businessName;
                session.user.phone = token.phone;
                session.user.currency = token.currency;
                session.user.timezone = token.timezone;
                session.user.avatar = token.avatar;
                session.user.userId = token.userId;
            }
            return session;
        },
    },
    pages: {
        signIn: '/auth/login',
        error: '/auth/error',
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig;
