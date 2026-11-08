export interface LocaleMeta {
  name: string
}

export const LOCALE_META = {
  en: { name: 'English' },
  es: { name: 'Español' },
} as const satisfies Record<string, LocaleMeta>

export type Locale = keyof typeof LOCALE_META

export const AVAILABLE_LOCALES = Object.keys(LOCALE_META) as readonly Locale[]
