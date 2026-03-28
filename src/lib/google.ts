import { google } from 'googleapis';
import User from '@/models/User';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

export function getGoogleAuthUrl() {
    const scopes = [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
    ];

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
    });
}

export async function getTokensFromCode(code: string) {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
}

export async function createMeetEvent(userId: string, clientEmail: string, projectName: string) {
    const user = await User.findById(userId);
    if (!user || !user.googleRefreshToken) {
        throw new Error('Google account not connected');
    }

    const client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    client.setCredentials({
        refresh_token: user.googleRefreshToken,
        access_token: user.googleAccessToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: client });

    // Set meeting for tomorrow at 10 AM if no time provided, 
    // but usually we'll just create a placeholder event
    const startTime = new Date();
    startTime.setHours(startTime.getHours() + 24); 
    startTime.setMinutes(0, 0, 0);

    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration

    const event = {
        summary: `Meeting: ${projectName}`,
        description: `Project discussion for ${projectName}. Generated via FreelanceHub.`,
        start: {
            dateTime: startTime.toISOString(),
            timeZone: user.timezone || 'UTC',
        },
        end: {
            dateTime: endTime.toISOString(),
            timeZone: user.timezone || 'UTC',
        },
        attendees: clientEmail ? [{ email: clientEmail }] : [],
        conferenceData: {
            createRequest: {
                requestId: Math.random().toString(36).substring(7),
                conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
        },
    };

    const response = await calendar.events.insert({
        calendarId: 'primary',
        conferenceDataVersion: 1,
        requestBody: event,
    } as any);

    return response.data.hangoutLink;
}
