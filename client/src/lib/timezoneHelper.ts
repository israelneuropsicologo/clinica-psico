/**
 * Timezone Helper
 * Utilities for detecting, storing, and synchronizing user timezone
 */

/**
 * Get user's timezone automatically
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Store timezone in localStorage
 */
export function storeUserTimezone(timezone: string): void {
  localStorage.setItem("userTimezone", timezone);
}

/**
 * Get stored timezone from localStorage
 */
export function getStoredTimezone(): string | null {
  return localStorage.getItem("userTimezone");
}

/**
 * Initialize timezone (detect and store)
 */
export function initializeTimezone(): string {
  const storedTz = getStoredTimezone();
  if (storedTz) return storedTz;

  const detectedTz = getUserTimezone();
  storeUserTimezone(detectedTz);
  return detectedTz;
}

/**
 * Convert UTC timestamp to user's local timezone
 */
export function convertToUserTimezone(utcTimestamp: number, timezone: string): Date {
  const date = new Date(utcTimestamp);
  return new Date(date.toLocaleString("en-US", { timeZone: timezone }));
}

/**
 * Format date with timezone info
 */
export function formatDateWithTimezone(
  timestamp: number,
  timezone: string,
  locale: string = "pt-BR"
): { date: string; time: string; timezone: string } {
  const date = new Date(timestamp);
  return {
    date: date.toLocaleDateString(locale, { timeZone: timezone }),
    time: date.toLocaleTimeString(locale, {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
    }),
    timezone: timezone,
  };
}

/**
 * Get timezone offset in hours
 */
export function getTimezoneOffset(timezone: string): number {
  const now = new Date();
  const utcDate = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
  const tzDate = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
  return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
}

/**
 * Get list of common timezones
 */
export function getCommonTimezones(): Array<{ name: string; offset: string }> {
  const timezones = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Anchorage",
    "Pacific/Honolulu",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Moscow",
    "Asia/Dubai",
    "Asia/Kolkata",
    "Asia/Bangkok",
    "Asia/Shanghai",
    "Asia/Tokyo",
    "Australia/Sydney",
    "Pacific/Auckland",
    "America/Sao_Paulo",
    "America/Argentina/Buenos_Aires",
    "America/Mexico_City",
  ];

  return timezones.map((tz) => {
    const offset = getTimezoneOffset(tz);
    const sign = offset >= 0 ? "+" : "";
    return {
      name: tz,
      offset: `UTC${sign}${offset.toFixed(1)}`,
    };
  });
}

/**
 * Validate timezone string
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}
