import type { MessageKey } from '@/shared/i18n/messages/en'

export interface NavItem {
  labelKey: MessageKey
  name: string
  path: string
}

export const NAV_ITEMS: NavItem[] = [
  { labelKey: 'nav.home', name: 'home', path: '/' },
  { labelKey: 'nav.scheduler', name: 'scheduler', path: '/scheduler' },
  { labelKey: 'nav.summary', name: 'summary', path: '/summary' },
  { labelKey: 'nav.calendar', name: 'calendar', path: '/calendar' },
  { labelKey: 'nav.employees', name: 'employees', path: '/employees' },
  { labelKey: 'nav.archive', name: 'archive', path: '/archive' },
]
