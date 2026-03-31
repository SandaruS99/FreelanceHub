import { google } from 'googleapis';
import dbConnect from './db';
import User from '@/models/User';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

export function getAuthUrl(userId: string) {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: ['https://www.googleapis.com/auth/calendar.events'],
        state: userId, // Pass userId so callback knows who to save tokens for
    });
}

export async function getTokensFromCode(code: string) {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
}

export async function createMeetEvent(
    userId: string,
    clientEmail: string,
    projectTitle: string,
    startDateTime: string,     // ISO 8601 string
    durationMinutes: number    // e.g. 30, 60, 90, 120
) {
    await dbConnect();
    const user = await User.findById(userId);
    if (!user || !user.googleRefreshToken) {
        throw new Error('Google account not connected');
    }

    // Set credentials and let googleapis auto-refresh the access token
    oauth2Client.setCredentials({
        access_token: user.googleAccessToken,
        refresh_token: user.googleRefreshToken,
        expiry_date: user.googleTokenExpiry?.getTime(),
    });

    // Persist refreshed tokens after use
    oauth2Client.on('tokens', async (tokens) => {
        if (tokens.access_token) {
            user.googleAccessToken = tokens.access_token;
        }
        if (tokens.expiry_date) {
            user.googleTokenExpiry = new Date(tokens.expiry_date);
        }
        if (tokens.refresh_token) {
            user.googleRefreshToken = tokens.refresh_token;
        }
        await user.save();
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const startDate = new Date(startDateTime);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    const event = {
        summary: `Project Meeting: ${projectTitle}`,
        description: `Meeting scheduled via FreelanceHub for project "${projectTitle}".`,
        start: {
            dateTime: startDate.toISOString(),
            timeZone: user.timezone || 'UTC',
        },
        end: {
            dateTime: endDate.toISOString(),
            timeZone: user.timezone || 'UTC',
        },
        attendees: [{ email: clientEmail }],
        conferenceData: {
            createRequest: {
                requestId: `meet-${Date.now()}`,
                conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
        },
    };

    const response = await calendar.events.insert({
        calendarId: 'primary',
        conferenceDataVersion: 1,
        requestBody: event,
    });

    const meetLink = response.data.hangoutLink;
    if (!meetLink) throw new Error('Google Meet link was not generated. Ensure Google Meet is enabled on your Google Workspace.');

    return meetLink;
}
