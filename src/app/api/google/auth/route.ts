import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/google';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const url = await getAuthUrl();
        return NextResponse.redirect(url);
    } catch (error) {
        console.error('Google Auth redirect error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
