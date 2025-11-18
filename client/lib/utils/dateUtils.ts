
import { fromZonedTime } from 'date-fns-tz';
/**
 * Parses a date string and time string in the specified timezone and converts to UTC Date.
 * @param dateStr - Date in MM/dd/yy format
 * @param timeStr - Time in HH:mm format (24-hour)
 * @param timezone - IANA timezone identifier (e.g., 'America/New_York')
 * @returns UTC Date object
 * @throws Error if date/time format is invalid or timezone is invalid
 */
export function parseDateTimeToUTC(dateStr: string, timeStr: string, timezone?: string): Date {
  // Validate dateStr (MM/dd/yy)
  const dateParts = dateStr.split('/');
  if (dateParts.length !== 3 || dateParts.some(p => isNaN(Number(p)))) {
    throw new Error(`Invalid date format: expected MM/dd/yy, got "${dateStr}"`);
  }
  const [month, day, yearShort] = dateParts.map(Number) as [number, number, number];
  if (month < 1 || month > 12 || day < 1 || day > 31 || yearShort < 0 || yearShort > 99) {
    throw new Error(`Invalid date: month/day/year out of range in "${dateStr}"`);
  }
  const year = 2000 + yearShort; // Normalize 2-digit to 2000+

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
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
  } catch {
    throw new Error(`Invalid timezone: "${tz}"`);
  }

  // Parse and convert to UTC
  const dateTimeStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  

return fromZonedTime(dateTimeStr, tz);}