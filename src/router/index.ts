import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouterHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

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
        component: () => import('@/views/SchedulerView.vue'),
      },
      {
        path: '/employees',
        name: 'employees',
        component: () => import('@/views/EmployeesView.vue'),
      },
      {
        path: '/summary',
        name: 'summary',
        component: () => import('@/views/SummaryView.vue'),
      },
      {
        path: '/history',
        name: 'history',
        component: () => import('@/views/HistoryView.vue'),
      },
      {
        path: '/csv',
        name: 'csv',
        component: () => import('@/views/CsvView.vue'),
      },
    ],
  })
}

export const router = createAppRouter()
