import { google } from 'googleapis';
import dbConnect from './db';
import User from '@/models/User';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

export async function getAuthUrl() {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: ['https://www.googleapis.com/auth/calendar.events'],
    });
}

export async function getTokensFromCode(code: string) {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
}

export async function createMeetEvent(userId: string, clientEmail: string, projectTitle: string) {
    await dbConnect();
    const user = await User.findById(userId);
    if (!user || !user.googleRefreshToken) {
        throw new Error('Google account not connected');
    }

    // Set credentials and refresh if needed
    oauth2Client.setCredentials({
        access_token: user.googleAccessToken,
        refresh_token: user.googleRefreshToken,
        expiry_date: user.googleTokenExpiry?.getTime(),
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
        summary: `Project Meeting: ${projectTitle}`,
        description: `Meeting scheduled via FreelanceHub for project ${projectTitle}.`,
        start: {
            dateTime: new Date().toISOString(),
            timeZone: user.timezone || 'UTC',
        },
        end: {
            dateTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour later
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

    // Save tokens if they were refreshed
    if (oauth2Client.credentials.access_token && oauth2Client.credentials.access_token !== user.googleAccessToken) {
        user.googleAccessToken = oauth2Client.credentials.access_token;
        if (oauth2Client.credentials.expiry_date) {
            user.googleTokenExpiry = new Date(oauth2Client.credentials.expiry_date);
        }
        await user.save();
    }

    return response.data.hangoutLink;
}
