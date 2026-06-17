import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const calendar = google.calendar('v3');

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  status: string;
}

/**
 * Get OAuth2 client configured with Google Calendar credentials
 */
export function getGoogleCalendarClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google Calendar credentials not configured');
  }

  return new OAuth2Client(clientId, clientSecret);
}

/**
 * Get authorization URL for Google Calendar
 */
export function getAuthorizationUrl(redirectUri: string): string {
  const oauth2Client = getGoogleCalendarClient();

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.readonly',
    ],
    redirect_uri: redirectUri,
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code: string, redirectUri: string) {
  const oauth2Client = getGoogleCalendarClient();

  const { tokens } = await oauth2Client.getToken({
    code,
    redirect_uri: redirectUri,
  });

  return tokens;
}

/**
 * List events from Google Calendar
 */
export async function listCalendarEvents(
  accessToken: string,
  calendarId: string = 'primary',
  options?: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
  }
): Promise<CalendarEvent[]> {
  const oauth2Client = getGoogleCalendarClient();
  oauth2Client.setCredentials({ access_token: accessToken });

  const response = await calendar.events.list({
    auth: oauth2Client,
    calendarId,
    timeMin: options?.timeMin,
    timeMax: options?.timeMax,
    maxResults: options?.maxResults || 10,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return (response.data.items || []) as CalendarEvent[];
}

/**
 * Create event in Google Calendar
 */
export async function createCalendarEvent(
  accessToken: string,
  event: {
    summary: string;
    description?: string;
    start: {
      dateTime: string;
      timeZone?: string;
    };
    end: {
      dateTime: string;
      timeZone?: string;
    };
    attendees?: Array<{
      email: string;
    }>;
  },
  calendarId: string = 'primary'
): Promise<CalendarEvent> {
  const oauth2Client = getGoogleCalendarClient();
  oauth2Client.setCredentials({ access_token: accessToken });

  const response = await calendar.events.insert({
    auth: oauth2Client,
    calendarId,
    requestBody: event,
  });

  return response.data as CalendarEvent;
}

/**
 * Update event in Google Calendar
 */
export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  event: Partial<CalendarEvent>,
  calendarId: string = 'primary'
): Promise<CalendarEvent> {
  const oauth2Client = getGoogleCalendarClient();
  oauth2Client.setCredentials({ access_token: accessToken });

  const response = await calendar.events.update({
    auth: oauth2Client,
    calendarId,
    eventId,
    requestBody: event,
  });

  return response.data as CalendarEvent;
}

/**
 * Delete event from Google Calendar
 */
export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string,
  calendarId: string = 'primary'
): Promise<void> {
  const oauth2Client = getGoogleCalendarClient();
  oauth2Client.setCredentials({ access_token: accessToken });

  await calendar.events.delete({
    auth: oauth2Client,
    calendarId,
    eventId,
  });
}
