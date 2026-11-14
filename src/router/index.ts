import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue'
import { isAuthenticated } from '@/services/auth';
import { setUnauthorizedHandler } from '@/services/api';

const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/tabs/home' },
  { path: '/login', component: () => import('@/pages/LoginPage.vue'), meta: { guest: true } },
  { path: '/projets', component: () => import('@/pages/ProjetsPage.vue') },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      // Menu et sous-pages (l'onglet « Menu » reste actif)
      { path: 'home', component: () => import('@/pages/HomePage.vue') },
      { path: 'home/stock/articles', component: () => import('@/pages/stock/ArticlesPage.vue') },
      { path: 'home/stock/articles/new', component: () => import('@/pages/stock/ArticleFormPage.vue') },
      { path: 'home/stock/articles/:id', component: () => import('@/pages/stock/ArticlePage.vue') },
      { path: 'home/stock/articles/:id/edit', component: () => import('@/pages/stock/ArticleFormPage.vue') },
      { path: 'home/stock/providers', component: () => import('@/pages/stock/ProvidersPage.vue') },
      { path: 'home/stock/brands', component: () => import('@/pages/stock/BrandsPage.vue') },
      { path: 'home/tools/galaxy', component: () => import('@/pages/tools/GalaxyPage.vue') },

      { path: 'search', component: () => import('@/pages/SearchPage.vue') },
      { path: 'settings', component: () => import('@/pages/SettingsPage.vue') },
      { path: 'favorites', component: () => import('@/pages/FavoritesPage.vue') },

      // ERP
      { path: 'customers', component: () => import('@/pages/ClientsPage.vue') },
      { path: 'quotes', component: () => import('@/pages/QuotesPage.vue') },
      { path: 'tasks', component: () => import('@/pages/TasksPage.vue') },

      // Anciennes adresses
      { path: 'items', redirect: '/tabs/home/stock/articles' },
      { path: 'galaxy', redirect: '/tabs/home/tools/galaxy' },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Toutes les pages sauf /login exigent d'être connecté
router.beforeEach((to) => {
  if (to.meta.guest) {
    return isAuthenticated() ? '/tabs/home' : true;
  }
  if (!isAuthenticated()) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }
  return true;
});

// Réponse 401 de l'API : retour à la connexion
setUnauthorizedHandler(() => {
  if (router.currentRoute.value.path !== '/login') {
    router.replace({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } });
  }
});

export default router
