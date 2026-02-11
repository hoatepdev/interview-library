/**
 * Date and number formatting utilities using locale configuration
 */

import { LOCALE_CONFIG, type Locale } from '@interview-library/shared/i18n';

/**
 * Format a date according to locale configuration
 * @param date - Date to format (Date object, timestamp, or ISO string)
 * @param locale - Locale code (defaults to 'en')
 * @param includeTime - Whether to include time in the output
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | number | string,
  locale: Locale = 'en',
  includeTime = false
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const config = LOCALE_CONFIG[locale];
  const format = includeTime ? config.dateTimeFormat : config.dateFormat;

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');

  return format
    .replace('DD', day)
    .replace('MM', month)
    .replace('YYYY', String(year))
    .replace('HH', hours)
    .replace('mm', minutes);
}

/**
 * Format a number according to locale configuration
 * @param value - Number to format
 * @param locale - Locale code (defaults to 'en')
 * @param decimals - Number of decimal places (defaults to 0)
 * @returns Formatted number string
 */
export function formatNumber(value: number, locale: Locale = 'en', decimals = 0): string {
  const config = LOCALE_CONFIG[locale];

  // Split into integer and decimal parts
  const parts = value.toFixed(decimals).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  // Add thousands separators
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, config.numberFormat.thousands);

  // Combine with decimal part if present
  if (decimals > 0 && decimalPart) {
    return `${formattedInteger}${config.numberFormat.decimal}${decimalPart}`;
  }

  return formattedInteger;
}

/**
 * Format a percentage according to locale configuration
 * @param value - Value to format (0.5 = 50%)
 * @param locale - Locale code (defaults to 'en')
 * @param decimals - Number of decimal places (defaults to 0)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, locale: Locale = 'en', decimals = 0): string {
  return `${formatNumber(value * 100, locale, decimals)}%`;
}

/**
 * Format a duration in seconds to a human-readable string
 * @param seconds - Duration in seconds
 * @param locale - Locale code (defaults to 'en')
 * @returns Formatted duration string (e.g., "1h 30m" or "45m")
 */
export function formatDuration(seconds: number, locale: Locale = 'en'): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  if (secs > 0 && hours === 0) {
    // Only show seconds if no hours
    parts.push(`${secs}s`);
  }

  return parts.join(' ') || '0s';
}

/**
 * Format a relative time (e.g., "2 days ago", "in 3 hours")
 * @param date - Date to compare
 * @param locale - Locale code (defaults to 'en')
 * @param now - Reference date (defaults to current time)
 * @returns Formatted relative time string
 */
export function formatRelativeTime(
  date: Date | number | string,
  locale: Locale = 'en',
  now: Date = new Date()
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.floor(Math.abs(diffMs) / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  const isPast = diffMs > 0;

  const relativeStrings = {
    en: {
      justNow: 'just now',
      secondsAgo: (n: number) => `${n} second${n > 1 ? 's' : ''} ago`,
      secondsIn: (n: number) => `in ${n} second${n > 1 ? 's' : ''}`,
      minutesAgo: (n: number) => `${n} minute${n > 1 ? 's' : ''} ago`,
      minutesIn: (n: number) => `in ${n} minute${n > 1 ? 's' : ''}`,
      hoursAgo: (n: number) => `${n} hour${n > 1 ? 's' : ''} ago`,
      hoursIn: (n: number) => `in ${n} hour${n > 1 ? 's' : ''}`,
      daysAgo: (n: number) => `${n} day${n > 1 ? 's' : ''} ago`,
      daysIn: (n: number) => `in ${n} day${n > 1 ? 's' : ''}`,
      weeksAgo: (n: number) => `${n} week${n > 1 ? 's' : ''} ago`,
      weeksIn: (n: number) => `in ${n} week${n > 1 ? 's' : ''}`,
      monthsAgo: (n: number) => `${n} month${n > 1 ? 's' : ''} ago`,
      monthsIn: (n: number) => `in ${n} month${n > 1 ? 's' : ''}`,
      yearsAgo: (n: number) => `${n} year${n > 1 ? 's' : ''} ago`,
      yearsIn: (n: number) => `in ${n} year${n > 1 ? 's' : ''}`,
    },
    vi: {
      justNow: 'vừa xong',
      secondsAgo: (n: number) => `${n} giây trước`,
      secondsIn: (n: number) => `${n} giây nữa`,
      minutesAgo: (n: number) => `${n} phút trước`,
      minutesIn: (n: number) => `${n} phút nữa`,
      hoursAgo: (n: number) => `${n} giờ trước`,
      hoursIn: (n: number) => `${n} giờ nữa`,
      daysAgo: (n: number) => `${n} ngày trước`,
      daysIn: (n: number) => `${n} ngày nữa`,
      weeksAgo: (n: number) => `${n} tuần trước`,
      weeksIn: (n: number) => `${n} tuần nữa`,
      monthsAgo: (n: number) => `${n} tháng trước`,
      monthsIn: (n: number) => `${n} tháng nữa`,
      yearsAgo: (n: number) => `${n} năm trước`,
      yearsIn: (n: number) => `${n} năm nữa`,
    },
  };

  const strings = relativeStrings[locale];

  if (diffSec < 10) {
    return strings.justNow;
  } else if (diffSec < 60) {
    return isPast ? strings.secondsAgo(diffSec) : strings.secondsIn(diffSec);
  } else if (diffMin < 60) {
    return isPast ? strings.minutesAgo(diffMin) : strings.minutesIn(diffMin);
  } else if (diffHour < 24) {
    return isPast ? strings.hoursAgo(diffHour) : strings.hoursIn(diffHour);
  } else if (diffDay < 7) {
    return isPast ? strings.daysAgo(diffDay) : strings.daysIn(diffDay);
  } else if (diffWeek < 4) {
    return isPast ? strings.weeksAgo(diffWeek) : strings.weeksIn(diffWeek);
  } else if (diffMonth < 12) {
    return isPast ? strings.monthsAgo(diffMonth) : strings.monthsIn(diffMonth);
  } else {
    return isPast ? strings.yearsAgo(diffYear) : strings.yearsIn(diffYear);
  }
}

/**
 * Format file size in bytes to human-readable format
 * @param bytes - File size in bytes
 * @param locale - Locale code (defaults to 'en')
 * @param decimals - Number of decimal places (defaults to 2)
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number, locale: Locale = 'en', decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${formatNumber(bytes / Math.pow(k, i), locale, decimals)} ${sizes[i]}`;
}
