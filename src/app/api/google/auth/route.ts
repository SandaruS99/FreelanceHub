import { NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/google';
import dbConnect from '@/lib/db';

export async function GET() {
    try {
        const url = getGoogleAuthUrl();
        return NextResponse.redirect(url);
    } catch (error) {
        console.error('Google Auth error:', error);
        return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 });
    }
}
