import { createRouter, createWebHashHistory } from 'vue-router'
import AboutView from '@/views/AboutView.vue'
import HomeView from '@/views/HomeView.vue'

export const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/hello', name: 'hello', component: () => import('@/views/HelloPrimeView.vue') },
    { path: '/about', name: 'about', component: AboutView },
  ],
})
