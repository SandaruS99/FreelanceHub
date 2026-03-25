import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Counter from '@/models/Counter';
import { auth } from '@/lib/auth';

/**
 * Temporary migration route to assign IDs to existing freelancers
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session || (session.user as any)?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        await dbConnect();

        // Find all freelancers without a userId
        const users = await User.find({
            role: 'freelancer',
            userId: { $exists: false }
        });

        let migratedCount = 0;

        for (const user of users) {
            const counter = await Counter.findOneAndUpdate(
                { id: 'userId' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );

            const seq = counter.seq + 1000;
            user.userId = `FH-${seq}`;
            await user.save();
            migratedCount++;
        }

        return NextResponse.json({
            message: `Migration complete. Total freelancers migrated: ${migratedCount}`
        });
    } catch (error: any) {
        console.error('Migration error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
