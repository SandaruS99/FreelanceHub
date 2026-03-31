import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode } from '@/lib/google';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // userId encoded in state during /api/google/auth

    if (!state) {
        return NextResponse.redirect(new URL('/dashboard/settings?error=google_no_state', req.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL('/dashboard/settings?error=google_no_code', req.url));
    }

    try {
        await dbConnect();

        // Exchange code for tokens
        const tokens = await getTokensFromCode(code);

        // Save tokens to the user identified by the state param
        const updated = await User.findByIdAndUpdate(state, {
            googleAccessToken: tokens.access_token,
            googleRefreshToken: tokens.refresh_token,
            googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        });

        if (!updated) {
            return NextResponse.redirect(new URL('/dashboard/settings?error=google_user_not_found', req.url));
        }

        // Redirect back to Settings → Integrations tab with success
        return NextResponse.redirect(new URL('/dashboard/settings?tab=integrations&success=google_connected', req.url));
    } catch (error: any) {
        console.error('Google Callback Error:', error);
        return NextResponse.redirect(
            new URL(`/dashboard/settings?tab=integrations&error=google_failed&msg=${encodeURIComponent(error.message)}`, req.url)
        );
    }
}
