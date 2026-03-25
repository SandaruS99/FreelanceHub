import dbConnect from './db';
import UserActivity from '@/models/UserActivity';

export async function logActivity(userId: string, action: string, details?: string) {
    try {
        await dbConnect();
        await UserActivity.create({
            userId,
            action,
            details,
        });
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
}
