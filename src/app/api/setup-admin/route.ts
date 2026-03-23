import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        await dbConnect();

        const email = 'admin@freelancehub.com';
        const password = 'Admin@123456';

        const existingAdmin = await User.findOne({ email });
        if (existingAdmin) {
            return NextResponse.json({ message: 'Admin already exists!', email });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        await User.create({
            name: 'Super Admin',
            email,
            password: hashedPassword,
            role: 'admin',
            status: 'active',
            emailVerified: true,
        });

        return NextResponse.json({
            message: '🎉 SUCCESS! Super Admin account created.',
            user: {
                email,
                password,
                role: 'admin'
            },
            nextStep: 'Go to the login page and sign in with these credentials.'
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) });
    }
}
