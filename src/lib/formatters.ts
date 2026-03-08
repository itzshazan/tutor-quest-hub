import { format, formatDistanceToNow, parseISO } from "date-fns";

// ==================== Currency Formatting ====================

/**
 * Format a number as Indian Rupees (₹)
 */
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/**
 * Format a number as US Dollars ($)
 */
export function formatUSD(amount: number, decimals = 2): string {
  return `$${amount.toFixed(decimals)}`;
}

/**
 * Format a number as currency with proper locale
 */
export function formatCurrency(
  amount: number,
  currency: "INR" | "USD" = "INR",
  options?: { decimals?: number }
): string {
  const decimals = options?.decimals ?? 2;
  if (currency === "USD") {
    return formatUSD(amount, decimals);
  }
  return formatINR(amount);
}

// ==================== Date/Time Formatting ====================

/**
 * Format a date string or Date object for display
 */
export function formatDate(
  date: string | Date,
  formatStr: string = "MMM d, yyyy"
): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, formatStr);
}

/**
 * Format time from HH:MM:SS to HH:MM
 */
export function formatTime(time: string): string {
  return time.slice(0, 5);
}

/**
 * Format a date as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Format session date and time range
 */
export function formatSessionTime(
  sessionDate: string,
  startTime: string,
  endTime?: string
): string {
  const date = formatDate(sessionDate, "MMM d, yyyy");
  const start = formatTime(startTime);
  if (endTime) {
    return `${date} · ${start}–${formatTime(endTime)}`;
  }
  return `${date} · ${start}`;
}

// ==================== String Formatting ====================

/**
 * Get initials from a full name (e.g., "John Doe" → "JD")
 */
export function getInitials(name: string, maxChars = 2): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, maxChars);
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Format a percentage value
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// ==================== Number Formatting ====================

/**
 * Format a large number with K/M/B suffixes
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

/**
 * Format a rating with one decimal place
 */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}
