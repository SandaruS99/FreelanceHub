import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import dbConnect from './db';
import User from '@/models/User';
import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    prompt: 'select_account',
                },
            },
        }),
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
                if (!user.password) return null; // OAuth-only account

                const isValid = await bcrypt.compare(credentials.password as string, user.password);
                if (!isValid) return null;

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
                    userId: user.userId,
                };
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            // Handle Google OAuth sign-in
            if (account?.provider === 'google' && profile?.email) {
                try {
                    await dbConnect();

                    const existingUser = await User.findOne({ email: profile.email });

                    if (existingUser) {
                        // Update avatar if missing
                        if (!existingUser.avatar && (profile as any).picture) {
                            existingUser.avatar = (profile as any).picture;
                            await existingUser.save();
                        }
                        // Block suspended users
                        if (existingUser.status === 'suspended') {
                            return '/auth/suspended';
                        }
                        // Map existing DB user fields onto the NextAuth user object
                        user.id = existingUser._id.toString();
                        user.role = existingUser.role;
                        user.status = existingUser.status;
                        user.plan = existingUser.plan;
                        user.businessName = existingUser.businessName;
                        user.currency = existingUser.currency;
                        user.timezone = existingUser.timezone;
                        user.userId = existingUser.userId;
                        user.image = existingUser.avatar || (profile as any).picture;
                    } else {
                        // Create new Google user — auto approved (active)
                        const newUser = await User.create({
                            name: profile.name || user.name,
                            email: profile.email,
                            avatar: (profile as any).picture || '',
                            role: 'freelancer',
                            status: 'active',
                            emailVerified: true,
                        });
                        user.id = newUser._id.toString();
                        user.role = newUser.role;
                        user.status = newUser.status;
                        user.plan = newUser.plan;
                        user.userId = newUser.userId;
                        user.currency = newUser.currency;
                        user.timezone = newUser.timezone;
                    }
                    return true;
                } catch (error) {
                    console.error('Google signIn callback error:', error);
                    return false;
                }
            }
            return true;
        },
        ...authConfig.callbacks,
    },
});
