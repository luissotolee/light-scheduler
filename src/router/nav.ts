import type { MessageKey } from '@/shared/i18n/messages/en'

export interface NavItem {
  labelKey: MessageKey
  name: string
  path: string
  icon: string
}

export const NAV_ITEMS: NavItem[] = [
  { labelKey: 'nav.home', name: 'home', path: '/', icon: 'pi pi-home' },
  { labelKey: 'nav.scheduler', name: 'scheduler', path: '/scheduler', icon: 'pi pi-calendar' },
  { labelKey: 'nav.summary', name: 'summary', path: '/summary', icon: 'pi pi-table' },
  { labelKey: 'nav.calendar', name: 'calendar', path: '/calendar', icon: 'pi pi-calendar-plus' },
  { labelKey: 'nav.employees', name: 'employees', path: '/employees', icon: 'pi pi-users' },
  { labelKey: 'nav.archive', name: 'archive', path: '/archive', icon: 'pi pi-file-export' },
]
