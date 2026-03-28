import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode } from '@/lib/google';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.redirect(new URL('/dashboard/settings?error=google_no_code', req.url));
    }

    try {
        await dbConnect();
        
        // Exchange code for tokens
        const tokens = await getTokensFromCode(code);

        // Update user with Google tokens
        await User.findByIdAndUpdate(userId, {
            googleAccessToken: tokens.access_token,
            googleRefreshToken: tokens.refresh_token,
            googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined
        });

        // Redirect back to settings with success message
        return NextResponse.redirect(new URL('/dashboard/settings?success=google_connected', req.url));
    } catch (error: any) {
        console.error('Google Callback Error:', error);
        return NextResponse.redirect(new URL(`/dashboard/settings?error=google_failed&msg=${encodeURIComponent(error.message)}`, req.url));
    }
}
