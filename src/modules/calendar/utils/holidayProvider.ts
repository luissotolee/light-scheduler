import type { Locale } from '@/shared/i18n'
import { parseIsoDate } from '@/shared/utils/calendar'

export interface ProviderHoliday {
  date: string
  name: string
}

export interface HolidayRegionOption {
  code: string
  name: string
}

interface RawHoliday {
  date: string
  name: string
  type: string
}

export interface HolidayInstance {
  getCountries(lang?: string): Record<string, string>
  getStates(country: string, lang?: string): Record<string, string>
  getHolidays(year: number, lang?: string): RawHoliday[]
}

export type HolidayConstructor = new (
  country?: string,
  state?: string,
  opts?: { languages?: string | string[] },
) => HolidayInstance

export interface HolidayProvider {
  countryCodes(locale: Locale): Promise<string[]>
  regions(country: string, locale: Locale): Promise<HolidayRegionOption[]>
  holidays(input: {
    country: string
    region: string | null
    year: number
    locale: Locale
  }): Promise<ProviderHoliday[]>
}

export function createHolidayProvider(load: () => Promise<HolidayConstructor>): HolidayProvider {
  let constructorPromise: Promise<HolidayConstructor> | null = null

  function getConstructor(): Promise<HolidayConstructor> {
    if (!constructorPromise) {
      constructorPromise = load().catch((error: unknown) => {
        constructorPromise = null
        throw error
      })
    }
    return constructorPromise
  }

  return {
    async countryCodes(locale) {
      const Constructor = await getConstructor()
      const holidays = new Constructor()
      return Object.keys(holidays.getCountries(locale)).sort()
    },

    async regions(country, locale) {
      if (!country) return []
      const Constructor = await getConstructor()
      const holidays = new Constructor(country, undefined, { languages: [locale] })
      return Object.entries(holidays.getStates(country, locale))
        .map(([code, name]) => ({ code, name }))
        .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
    },

    async holidays({ country, region, year, locale }) {
      const Constructor = await getConstructor()
      const holidays = new Constructor(country, region ?? undefined, { languages: [locale] })
      const seen = new Set<string>()
      const result: ProviderHoliday[] = []

      for (const holiday of holidays.getHolidays(year, locale)) {
        if (holiday.type !== 'public') continue

        const date = parseIsoDate(String(holiday.date).slice(0, 10))
        if (date === null || date.slice(0, 4) !== String(year)) continue

        const name = holiday.name.trim()
        if (name === '') continue

        const key = `${date}|${name.toLowerCase()}`
        if (seen.has(key)) continue
        seen.add(key)
        result.push({ date, name })
      }

      return result.sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? -1 : 1
        return a.name < b.name ? -1 : a.name > b.name ? 1 : 0
      })
    },
  }
}

function defaultLoader(): Promise<HolidayConstructor> {
  return import('date-holidays').then(
    (module) => module.default as unknown as HolidayConstructor,
  )
}

export const holidayProvider: HolidayProvider = createHolidayProvider(defaultLoader)
