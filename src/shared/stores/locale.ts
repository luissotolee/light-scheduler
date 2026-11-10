import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { isLocale } from '@/shared/i18n/types'
import type { Locale } from '@/shared/i18n/types'
import { readUserSettings, writeUserSettingsLocale } from '@/shared/utils/userSettings'

export { isLocale }

export function readInitialLocale(): Locale {
  return readUserSettings().locale ?? 'en'
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
    writeUserSettingsLocale(next)
  }

  return { locale, setLocale }
})
