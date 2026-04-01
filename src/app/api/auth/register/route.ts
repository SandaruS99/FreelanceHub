import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const { name, email, password, businessName, whatsapp } = await req.json();

        if (!name || !email || !password || !whatsapp) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
        }

        await dbConnect();

        const existing = await User.findOne({ email });
        if (existing) {
            return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
        }

        const verificationToken = randomBytes(32).toString('hex');

        const user = await User.create({
            name,
            email,
            password,
            businessName,
            whatsapp,
            role: 'freelancer',
            status: 'active',   // Auto-approved — no admin review required
            emailVerified: true,
            verificationToken,
        });

        return NextResponse.json(
            {
                message: 'Registration successful! You can now sign in.',
                userId: user._id,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Register error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
