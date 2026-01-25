/**
 * Daily Verse Domain Logic
 * Pure functions for date-based verse selection.
 * No external dependencies - easily testable.
 */

/**
 * Calculates the day of year (1-366) for a given date.
 *
 * @param date - The date to calculate for (defaults to now)
 * @returns Day of year: 1 for Jan 1, 365/366 for Dec 31
 *
 * @example
 * getDayOfYear(new Date('2026-01-01')) // returns 1
 * getDayOfYear(new Date('2026-12-31')) // returns 365
 * getDayOfYear(new Date('2028-12-31')) // returns 366 (leap year)
 */
export function getDayOfYear(date: Date = new Date()): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diffMs = date.getTime() - startOfYear.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Determines if a year is a leap year.
 *
 * @param year - Four-digit year
 * @returns true if leap year
 *
 * @example
 * isLeapYear(2024) // true
 * isLeapYear(2025) // false
 * isLeapYear(2000) // true (divisible by 400)
 * isLeapYear(1900) // false (divisible by 100 but not 400)
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Gets the total days in a year.
 *
 * @param year - Four-digit year
 * @returns 365 or 366
 */
export function getDaysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

/**
 * Normalizes day of year for non-leap years.
 * If database has 366 entries but current year has 365 days,
 * day 366 (Dec 31 of leap year) maps to day 365.
 *
 * @param dayOfYear - Raw day of year (1-366)
 * @param year - The year to normalize for
 * @returns Normalized day (1-365 for non-leap, 1-366 for leap)
 */
export function normalizeDayOfYear(dayOfYear: number, year: number): number {
  const maxDay = getDaysInYear(year);
  return Math.min(dayOfYear, maxDay);
}
