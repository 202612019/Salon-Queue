import type { Locale } from '../i18n/dictionaries'

export const salonTimeZone = 'Asia/Kolkata'
export function formatPrice(paise: number, locale: Locale) {
  return new Intl.NumberFormat(locale === 'gu' ? 'gu-IN' : 'en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(paise / 100)
}
export function formatSalonDate(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'gu' ? 'gu-IN' : 'en-IN', { timeZone: salonTimeZone, day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}
export function formatSalonClock(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'gu' ? 'gu-IN' : 'en-IN', { timeZone: salonTimeZone, hour: '2-digit', minute: '2-digit', hour12: true }).format(date)
}
