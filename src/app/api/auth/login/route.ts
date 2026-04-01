import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

// This endpoint pre-validates the user status BEFORE passing to NextAuth.
// NextAuth v5 strips custom error codes, so we check here first and return
// clean JSON error codes the frontend can read directly.
export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'MISSING_CREDENTIALS' }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        if (!user) {
            return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 });
        }

        const isValid = user.password ? await bcrypt.compare(password, user.password) : false;
        if (!isValid) {
            return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 });
        }

        // Credentials are valid and user is active — let the caller proceed with NextAuth signIn
        return NextResponse.json({ ok: true }, { status: 200 });

    } catch (error) {
        console.error('Login pre-check error:', error);
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
}
