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
        path: '/csv',
        name: 'csv',
        component: () => import('@/modules/csv/views/CsvView.vue'),
      },
    ],
  })
}

export const router = createAppRouter()
