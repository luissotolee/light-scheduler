import type { MessageKey } from '@/shared/i18n/messages/en'

export interface NavItem {
  labelKey: MessageKey
  name: string
  path: string
}

export const NAV_ITEMS: NavItem[] = [
  { labelKey: 'nav.home', name: 'home', path: '/' },
  { labelKey: 'nav.scheduler', name: 'scheduler', path: '/scheduler' },
  { labelKey: 'nav.employees', name: 'employees', path: '/employees' },
  { labelKey: 'nav.summary', name: 'summary', path: '/summary' },
  { labelKey: 'nav.history', name: 'history', path: '/history' },
  { labelKey: 'nav.csv', name: 'csv', path: '/csv' },
]
