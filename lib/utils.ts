import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number to a string using English (Western) numerals.
 * Always uses 'en-US' locale to ensure numbers are displayed as 0-9
 * regardless of the current language setting.
 */
export function formatNumber(value: number | string | null | undefined, options?: Intl.NumberFormatOptions): string {
  if (value === null || value === undefined) return "0"
  const num = typeof value === "string" ? parseFloat(value) : value
  if (Number.isNaN(num)) return "0"
  return new Intl.NumberFormat("en-US", options).format(num)
}

/**
 * Format a number to a locale string using English numerals.
 * This is a drop-in replacement for toLocaleString() that always uses English numerals.
 */
export function toEnglishLocaleString(value: number | string | null | undefined, options?: Intl.NumberFormatOptions): string {
  return formatNumber(value, options)
}

/**
 * Format a date to a string with English numerals for day/year.
 * Month names can be localized, but numeric parts will always be in English.
 */
export function formatDateEnglish(date: Date | string | number | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return ""
  const dateObj = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(dateObj.valueOf())) return String(date)
  
  // Use 'en-US' locale to ensure numbers are in English
  // but allow month names to be localized if needed
  return new Intl.DateTimeFormat(withGregorianCalendar("en-US"), options).format(dateObj)
}

/**
 * Ensure a locale string always uses the Gregorian calendar (prevents Hijri on some devices/locales).
 * Uses Unicode extension key: `u-ca-gregory`.
 */
export function withGregorianCalendar(locale: string): string {
  if (!locale) return "en-US-u-ca-gregory"

  const parts = locale.split("-u-")
  if (parts.length === 1) return `${locale}-u-ca-gregory`

  const base = parts[0]
  const ext = parts.slice(1).join("-u-")
  const tokens = ext.split("-").filter(Boolean)

  // Replace existing calendar if present, else append it.
  const next: string[] = []
  let i = 0
  let replaced = false
  while (i < tokens.length) {
    const token = tokens[i]
    if (token === "ca" && i + 1 < tokens.length) {
      next.push("ca", "gregory")
      i += 2
      replaced = true
      continue
    }
    next.push(token)
    i += 1
  }
  if (!replaced) next.push("ca", "gregory")

  return `${base}-u-${next.join("-")}`
}

/**
 * Format a date using a specific locale, always forcing Gregorian calendar.
 * Safer replacement for `toLocaleDateString()` / `Intl.DateTimeFormat()` when device calendar may be Hijri.
 */
export function formatDateLocale(
  date: Date | string | number | null | undefined,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return ""
  const dateObj = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(dateObj.valueOf())) return String(date)
  return new Intl.DateTimeFormat(withGregorianCalendar(locale), options).format(dateObj)
}

/**
 * Format date+time using a specific locale, always forcing Gregorian calendar.
 */
export function formatDateTimeLocale(
  date: Date | string | number | null | undefined,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  return formatDateLocale(date, locale, options)
}

/**
 * Format a date to a date string with English numerals.
 * Drop-in replacement for toLocaleDateString() that always uses English numerals.
 */
export function toEnglishLocaleDateString(date: Date | string | number | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  return formatDateEnglish(date, options)
}

/**
 * Format a date to a time string with English numerals.
 * Drop-in replacement for toLocaleTimeString() that always uses English numerals.
 */
export function toEnglishLocaleTimeString(date: Date | string | number | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return ""
  const dateObj = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(dateObj.valueOf())) return ""
  
  return new Intl.DateTimeFormat(withGregorianCalendar("en-US"), {
    ...options,
    hour: options?.hour ?? "2-digit",
    minute: options?.minute ?? "2-digit",
  }).format(dateObj)
}

/**
 * Format currency with English numerals.
 * Always uses 'en-US' locale to ensure numbers are displayed as 0-9.
 */
export function formatCurrency(amount: number | string | null | undefined, currency: string = "USD", options?: Intl.NumberFormatOptions): string {
  return formatNumber(amount, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  })
}
