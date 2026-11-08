import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { AVAILABLE_LOCALES } from '@/shared/i18n/types'
import type { Locale } from '@/shared/i18n/types'

const STORAGE_KEY = 'light-scheduler.locale'

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === 'string' && (AVAILABLE_LOCALES as readonly string[]).includes(value)
  )
}

export function readInitialLocale(): Locale {
  try {
    if (typeof localStorage === 'undefined') return 'en'
    const stored = localStorage.getItem(STORAGE_KEY)
    return isLocale(stored) ? stored : 'en'
  } catch {
    return 'en'
  }
}

export const useLocaleStore = defineStore('locale', () => {
  const locale = ref<Locale>(readInitialLocale())

  watch(
    locale,
    (value) => {
      if (typeof document !== 'undefined') {
        document.documentElement.lang = value
      }
    },
    { immediate: true },
  )

  function setLocale(next: Locale): void {
    if (!isLocale(next)) return
    locale.value = next
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, next)
      }
    } catch {
      // Persistence is best effort; the in-memory locale still changes.
    }
  }

  return { locale, setLocale }
})
