import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import dbConnect from './db';
import User from '@/models/User';
import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                await dbConnect();
                const user = await User.findOne({ email: credentials.email }).select('+password');

                if (!user) return null;

                const isValid = await bcrypt.compare(credentials.password as string, user.password);
                if (!isValid) return null;

                if (user.status === 'pending') {
                    throw new Error('PENDING_APPROVAL');
                }
                if (user.status === 'suspended') {
                    throw new Error('ACCOUNT_SUSPENDED');
                }

                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    status: user.status,
                    plan: user.plan,
                    businessName: user.businessName,
                    phone: user.phone,
                    currency: user.currency,
                    timezone: user.timezone,
                    image: user.avatar,
                };
            },
        }),
    ],
});
