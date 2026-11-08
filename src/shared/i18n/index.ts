import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import type { Ref } from 'vue'
import { useLocaleStore } from '@/shared/stores/locale'
import { en } from './messages/en'
import type { MessageKey, Messages } from './messages/en'
import { es } from './messages/es'
import { AVAILABLE_LOCALES, LOCALE_META } from './types'
import type { Locale, LocaleMeta } from './types'

export type { Locale, LocaleMeta, MessageKey, Messages }
export { AVAILABLE_LOCALES, LOCALE_META }

export const messages: Record<Locale, Messages> = { en, es }

export interface I18n {
  t: (key: MessageKey, params?: Record<string, string | number>) => string
  /**
   * Resolves a two-form plural message: `oneKey` when `count === 1`, `otherKey` otherwise.
   * Only the en/es two-form contract is supported, so 0 and counts above 1 take the plural.
   * A locale whose plural rules add zero/few/many categories requires `Intl.PluralRules`.
   */
  tc: (
    oneKey: MessageKey,
    otherKey: MessageKey,
    count: number,
    params?: Record<string, string | number>,
  ) => string
  locale: Ref<Locale>
  setLocale: (next: Locale) => void
  availableLocales: readonly Locale[]
}

export function translate(
  catalog: Partial<Messages>,
  key: MessageKey,
  params?: Record<string, string | number>,
): string {
  const template = catalog[key] ?? en[key] ?? key

  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params?.[name]
    return value === undefined ? match : String(value)
  })
}

export function useI18n(): I18n {
  const store = useLocaleStore()
  const { locale } = storeToRefs(store)
  const catalog = computed<Messages>(() => messages[locale.value])

  function t(key: MessageKey, params?: Record<string, string | number>): string {
    return translate(catalog.value, key, params)
  }

  function tc(
    oneKey: MessageKey,
    otherKey: MessageKey,
    count: number,
    params?: Record<string, string | number>,
  ): string {
    // Two-form contract: singular at exactly 1, plural for 0 and all other counts.
    return t(count === 1 ? oneKey : otherKey, params)
  }

  function setLocale(next: Locale): void {
    store.setLocale(next)
  }

  return { t, tc, locale, setLocale, availableLocales: AVAILABLE_LOCALES }
}
