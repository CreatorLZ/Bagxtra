import { fromZonedTime } from 'date-fns-tz';
import { formatDistanceToNow } from 'date-fns';

/**
 * Formats a date as relative time (e.g., "2 mins ago", "1 hour ago")
 * @param date - Date to format
 * @returns Relative time string
 */
export function formatTimeAgo(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Parses a date string and time string in the specified timezone and converts to UTC Date.
 * @param dateStr - Date in MM/dd/yyyy format
 * @param timeStr - Time in HH:mm format (24-hour)
 * @param timezone - IANA timezone identifier (e.g., 'America/New_York')
 * @returns UTC Date object
 * @throws Error if date/time format is invalid or timezone is invalid
 */
export function parseDateTimeToUTC(
  dateStr: string,
  timeStr: string,
  timezone: string
): Date {
  // Validate dateStr (MM/dd/yyyy)
  const dateParts = dateStr.split('/');
  if (dateParts.length !== 3 || dateParts.some(p => isNaN(Number(p)))) {
    throw new Error(
      `Invalid date format: expected MM/dd/yyyy, got "${dateStr}"`
    );
  }
  const [month, day, year] = dateParts.map(Number) as [number, number, number];
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    year < 1900 ||
    year > 2100
  ) {
    throw new Error(
      `Invalid date: month/day/year out of range in "${dateStr}"`
    );
  }

  // Validate timeStr (HH:mm)
  const timeParts = timeStr.split(':');
  if (timeParts.length !== 2 || timeParts.some(p => isNaN(Number(p)))) {
    throw new Error(`Invalid time format: expected HH:mm, got "${timeStr}"`);
  }
  const [hour, minute] = timeParts.map(Number) as [number, number];
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error(`Invalid time: hour/minute out of range in "${timeStr}"`);
  }

  // Validate timezone
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
  } catch {
    throw new Error(`Invalid timezone: "${timezone}"`);
  }

  // Parse and convert to UTC
  const dateTimeStr = `${year}-${String(month).padStart(2, '0')}-${String(
    day
  ).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(
    minute
  ).padStart(2, '0')}`;

  // fromZonedTime will correctly parse the string as if it were in the
  // specified 'timezone' and return the equivalent UTC Date object.
  return fromZonedTime(dateTimeStr, timezone);
}
