import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  // ───── 공개 라우트 (requiresAuth) ─────
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/public/LoginView.vue')
  },
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/public/HomeView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/matches',
    name: 'matches',
    component: () => import('@/views/public/MatchListView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/matches/:id',
    name: 'match-detail',
    component: () => import('@/views/public/MatchDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/players',
    name: 'players',
    component: () => import('@/views/public/PlayerListView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/players/:id',
    name: 'player-detail',
    component: () => import('@/views/public/PlayerDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/rankings',
    name: 'rankings',
    component: () => import('@/views/public/RankingsView.vue'),
    meta: { requiresAuth: true }
  },

  // ───── 관리자 라우트 (requiresAdmin) ─────
  {
    path: '/admin',
    name: 'admin-dashboard',
    component: () => import('@/views/admin/AdminDashboardView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/matches/new',
    name: 'admin-match-new',
    component: () => import('@/views/admin/MatchEditView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/matches/:id/edit',
    name: 'admin-match-edit',
    component: () => import('@/views/admin/MatchEditView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/matches/:id/result',
    name: 'admin-match-result',
    component: () => import('@/views/admin/MatchResultInputView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/players',
    name: 'admin-players',
    component: () => import('@/views/admin/PlayerManageView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/allowed-emails',
    name: 'admin-allowed-emails',
    component: () => import('@/views/admin/AllowedEmailsView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/audit-logs',
    name: 'admin-audit-logs',
    component: () => import('@/views/admin/AuditLogsView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },

  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  await authStore.ensureReady()

  if (to.meta.requiresAuth && !authStore.isAuthed) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return { path: '/' }
  }
  if (to.name === 'login' && authStore.isAuthed) {
    return { path: '/' }
  }
})

export default router
