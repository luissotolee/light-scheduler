export interface NavItem {
  label: string
  name: string
  path: string
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', name: 'home', path: '/' },
  { label: 'Scheduler', name: 'scheduler', path: '/scheduler' },
  { label: 'Employees', name: 'employees', path: '/employees' },
  { label: 'Summary', name: 'summary', path: '/summary' },
  { label: 'History', name: 'history', path: '/history' },
  { label: 'CSV I/O', name: 'csv', path: '/csv' },
]
