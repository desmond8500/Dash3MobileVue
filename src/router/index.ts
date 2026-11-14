import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue'

const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/tabs/home' },
  { path: '/projets', component: () => import('@/pages/ProjetsPage.vue') },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      { path: 'home', component: () => import('@/pages/HomePage.vue') },
      { path: 'customers', component: () => import('@/pages/ClientsPage.vue') },
      { path: 'quotes', component: () => import('@/pages/QuotesPage.vue') },
      { path: 'tasks', component: () => import('@/pages/TasksPage.vue') },
      { path: 'items', component: () => import('@/pages/ItemsPage.vue') },
      { path: 'galaxy', component: () => import('@/pages/GalaxyPage.vue') },
      { path: 'favorites', component: () => import('@/pages/FavoritesPage.vue') },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
