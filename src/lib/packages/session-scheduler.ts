/**
 * Session Scheduler — Pure function for calculating session dates.
 *
 * Given a start date, time range, session count, and frequency,
 * produces an array of ScheduledSession with the exact dates and times.
 */

export type Frequency = 'weekly' | 'biweekly' | 'monthly';

export interface ScheduledSession {
  date: Date;
  startTime: string;
  endTime: string;
}

/** Days to add per frequency (using exact week multiples to preserve day of week) */
const FREQUENCY_DAYS: Record<Frequency, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 28,
};

/**
 * Calculate the scheduled dates for a session package.
 *
 * @param startDate - The date of the first session
 * @param startTime - Start time in HH:mm format (same for all sessions)
 * @param endTime - End time in HH:mm format (same for all sessions)
 * @param sessionCount - Total number of sessions to schedule (≥ 1)
 * @param frequency - Interval between sessions: weekly (7d), biweekly (15d), monthly (30d)
 * @returns Array of ScheduledSession with exactly `sessionCount` elements
 */
export function calculateSessionDates(
  startDate: Date,
  startTime: string,
  endTime: string,
  sessionCount: number,
  frequency: Frequency,
): ScheduledSession[] {
  const intervalDays = FREQUENCY_DAYS[frequency];
  const sessions: ScheduledSession[] = [];

  for (let i = 0; i < sessionCount; i++) {
    const date = new Date(startDate.getTime());
    date.setDate(date.getDate() + i * intervalDays);

    sessions.push({ date, startTime, endTime });
  }

  return sessions;
}
