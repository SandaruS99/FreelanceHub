import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    providers: [],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.status = (user as any).status;
                token.plan = (user as any).plan;
                token.businessName = (user as any).businessName;
                token.phone = (user as any).phone;
                token.currency = (user as any).currency;
                token.timezone = (user as any).timezone;
                token.avatar = (user as any).avatar;
                token.userId = (user as any).userId;
            }
            // Allow session.update() to refresh token fields
            if (trigger === 'update' && session) {
                return { ...token, ...session };
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                (session.user as any).role = token.role;
                (session.user as any).status = token.status;
                (session.user as any).plan = token.plan;
                (session.user as any).businessName = token.businessName;
                (session.user as any).phone = token.phone;
                (session.user as any).currency = token.currency;
                (session.user as any).timezone = token.timezone;
                (session.user as any).avatar = token.avatar;
                (session.user as any).userId = token.userId;
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
