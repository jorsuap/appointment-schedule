import { google } from 'googleapis';

function getAuthClient() {
  const credentials = {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  return new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
}

interface CreateEventParams {
  calendarId: string; // Professional's calendar ID (their email or calendar ID)
  summary: string;
  description: string;
  startDateTime: string; // ISO 8601
  endDateTime: string; // ISO 8601
  attendeeEmail: string; // Patient's email
  timeZone?: string;
}

/**
 * Create a Google Calendar event with Google Meet link
 * Returns the event ID and Meet link
 */
export async function createCalendarEvent(params: CreateEventParams) {
  const {
    calendarId,
    summary,
    description,
    startDateTime,
    endDateTime,
    attendeeEmail,
    timeZone = 'America/Bogota',
  } = params;

  const auth = getAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  const event = await calendar.events.insert({
    calendarId,
    conferenceDataVersion: 1,
    requestBody: {
      summary,
      description,
      start: {
        dateTime: startDateTime,
        timeZone,
      },
      end: {
        dateTime: endDateTime,
        timeZone,
      },
      conferenceData: {
        createRequest: {
          requestId: `conalma-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 15 },
        ],
      },
    },
  });

  const meetLink = event.data.conferenceData?.entryPoints?.find(
    (ep) => ep.entryPointType === 'video',
  )?.uri;

  return {
    eventId: event.data.id,
    meetLink: meetLink || null,
    htmlLink: event.data.htmlLink,
  };
}

/**
 * Delete a Google Calendar event (for cancellations)
 */
export async function deleteCalendarEvent(calendarId: string, eventId: string) {
  const auth = getAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  await calendar.events.delete({
    calendarId,
    eventId,
    sendUpdates: 'all',
  });
}
