import NextAuth, { DefaultSession } from 'next-auth';

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
