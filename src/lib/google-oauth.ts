import { createHmac, timingSafeEqual } from 'crypto';

// ─── Constants ───────────────────────────────────────────────────────────────

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const GOOGLE_CALENDAR_EVENTS_URL =
  'https://www.googleapis.com/calendar/v3/calendars';

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresAt: Date;
}

export interface CreateEventParams {
  accessToken: string;
  calendarId?: string;
  summary: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  attendeeEmail: string;
  timeZone?: string;
}

export interface CalendarEventResult {
  eventId: string;
  meetLink: string;
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

function getEnvOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getRedirectUri(): string {
  const appUrl = getEnvOrThrow('NEXT_PUBLIC_APP_URL');
  return `${appUrl}/api/professional/google-calendar/callback`;
}

/**
 * Signs a payload with HMAC-SHA256 using OAUTH_ENCRYPTION_KEY.
 * Returns: `payload.signature` (dot-separated).
 */
function signState(payload: string): string {
  const key = getEnvOrThrow('OAUTH_ENCRYPTION_KEY');
  const signature = createHmac('sha256', key)
    .update(payload)
    .digest('hex');
  return `${payload}.${signature}`;
}

/**
 * Verifies an HMAC-signed state string.
 * Returns the original payload if valid, throws otherwise.
 */
export function verifyState(signedState: string): string {
  const lastDotIndex = signedState.lastIndexOf('.');
  if (lastDotIndex === -1) {
    throw new Error('Invalid state format: missing signature');
  }

  const payload = signedState.substring(0, lastDotIndex);
  const providedSignature = signedState.substring(lastDotIndex + 1);

  const key = getEnvOrThrow('OAUTH_ENCRYPTION_KEY');
  const expectedSignature = createHmac('sha256', key)
    .update(payload)
    .digest('hex');

  const providedBuffer = Buffer.from(providedSignature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new Error('Invalid state: signature verification failed');
  }

  return payload;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Builds the Google OAuth 2.0 consent URL with a signed state parameter
 * to prevent CSRF attacks.
 */
export function buildGoogleOAuthUrl(professionalId: string): string {
  const clientId = getEnvOrThrow('GOOGLE_OAUTH_CLIENT_ID');
  const redirectUri = getRedirectUri();
  const state = signState(professionalId);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchanges an authorization code for access and refresh tokens.
 */
export async function exchangeCodeForTokens(
  code: string,
): Promise<TokenResponse> {
  const clientId = getEnvOrThrow('GOOGLE_OAUTH_CLIENT_ID');
  const clientSecret = getEnvOrThrow('GOOGLE_OAUTH_CLIENT_SECRET');
  const redirectUri = getRedirectUri();

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to exchange authorization code: ${response.status} ${errorBody}`,
    );
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  if (!data.refresh_token) {
    throw new Error(
      'No refresh token received. Ensure prompt=consent and access_type=offline are set.',
    );
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

/**
 * Refreshes an access token using a refresh token.
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<RefreshTokenResponse> {
  const clientId = getEnvOrThrow('GOOGLE_OAUTH_CLIENT_ID');
  const clientSecret = getEnvOrThrow('GOOGLE_OAUTH_CLIENT_SECRET');

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to refresh access token: ${response.status} ${errorBody}`,
    );
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

/**
 * Revokes a token (access or refresh) at Google's revocation endpoint.
 */
export async function revokeToken(token: string): Promise<void> {
  const response = await fetch(
    `${GOOGLE_REVOKE_URL}?token=${encodeURIComponent(token)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to revoke token: ${response.status} ${errorBody}`);
  }
}

/**
 * Creates a Google Calendar event with Google Meet conferencing.
 * Fire-and-forget friendly: returns null on failure instead of throwing.
 */
export async function createCalendarEvent(
  params: CreateEventParams,
): Promise<CalendarEventResult | null> {
  try {
    const {
      accessToken,
      calendarId = 'primary',
      summary,
      description,
      startDateTime,
      endDateTime,
      attendeeEmail,
      timeZone = 'America/Bogota',
    } = params;

    const eventPayload = {
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
      attendees: [{ email: attendeeEmail }],
      conferenceData: {
        createRequest: {
          requestId: `conalma-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
    };

    const url = `${GOOGLE_CALENDAR_EVENTS_URL}/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `[google-oauth] Failed to create calendar event: ${response.status} ${errorBody}`,
      );
      return null;
    }

    const data = (await response.json()) as {
      id: string;
      hangoutLink?: string;
      conferenceData?: {
        entryPoints?: Array<{ uri: string; entryPointType: string }>;
      };
    };

    const meetLink =
      data.hangoutLink ??
      data.conferenceData?.entryPoints?.find(
        (ep) => ep.entryPointType === 'video',
      )?.uri ??
      '';

    if (!data.id) {
      console.error(
        '[google-oauth] Calendar event created but no ID returned',
      );
      return null;
    }

    return {
      eventId: data.id,
      meetLink,
    };
  } catch (error) {
    console.error('[google-oauth] Error creating calendar event:', error);
    return null;
  }
}
