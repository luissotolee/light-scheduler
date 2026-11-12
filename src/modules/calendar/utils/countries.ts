import type { Locale } from '@/shared/i18n'
import { intlLocale } from '@/shared/utils/calendar'

export function countryLabel(code: string, locale: Locale): string {
  try {
    return new Intl.DisplayNames([intlLocale(locale)], { type: 'region' }).of(code) ?? code
  } catch {
    return code
  }
}
