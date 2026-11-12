import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouterHistory } from 'vue-router'
import HomeView from '@/modules/home/views/HomeView.vue'

export function createAppRouter(
  history: RouterHistory = createWebHashHistory(import.meta.env.BASE_URL),
) {
  return createRouter({
    history,
    routes: [
      { path: '/', name: 'home', component: HomeView },
      {
        path: '/scheduler',
        name: 'scheduler',
        component: () => import('@/modules/scheduler/views/SchedulerView.vue'),
      },
      {
        path: '/calendar',
        name: 'calendar',
        component: () => import('@/modules/calendar/views/CalendarView.vue'),
      },
      {
        path: '/employees',
        name: 'employees',
        component: () => import('@/modules/employees/views/EmployeesView.vue'),
      },
      {
        path: '/summary',
        name: 'summary',
        component: () => import('@/modules/summary/views/SummaryView.vue'),
      },
      {
        path: '/archive',
        name: 'archive',
        component: () => import('@/modules/archive/views/ArchiveView.vue'),
      },
    ],
  })
}

export const router = createAppRouter()
