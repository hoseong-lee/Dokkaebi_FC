import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { pushToast } from '@/composables/useToast'

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
  {
    path: '/announcements',
    name: 'announcements',
    component: () => import('@/views/public/AnnouncementsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/board',
    name: 'board',
    component: () => import('@/views/public/BoardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/board/new',
    name: 'board-new',
    component: () => import('@/views/public/BoardEditView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/board/:id',
    name: 'board-detail',
    component: () => import('@/views/public/BoardDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/board/:id/edit',
    name: 'board-edit',
    component: () => import('@/views/public/BoardEditView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/photos',
    name: 'photos',
    component: () => import('@/views/public/PhotosView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/photos/new',
    name: 'photo-new',
    component: () => import('@/views/public/PhotoPostEditView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/photos/:id',
    name: 'photo-detail',
    component: () => import('@/views/public/PhotoPostDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/photos/:id/edit',
    name: 'photo-edit',
    component: () => import('@/views/public/PhotoPostEditView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/calendar',
    name: 'calendar',
    component: () => import('@/views/public/CalendarView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/hall-of-fame',
    name: 'hall-of-fame',
    component: () => import('@/views/public/HallOfFameView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/guide',
    name: 'soccer-guide',
    component: () => import('@/views/public/SoccerGuideView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/more',
    name: 'more',
    component: () => import('@/views/public/MoreView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/me',
    name: 'me',
    component: () => import('@/views/public/MyPageView.vue'),
    meta: { requiresAuth: true }
  },

  // ───── 관리자 라우트 (requiresAdmin) ─────
  {
    path: '/admin',
    component: () => import('@/components/layout/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: () => import('@/views/admin/AdminDashboardView.vue')
      },
      {
        path: 'matches/new',
        name: 'admin-match-new',
        component: () => import('@/views/admin/MatchEditView.vue')
      },
      {
        path: 'matches/:id/edit',
        name: 'admin-match-edit',
        component: () => import('@/views/admin/MatchEditView.vue')
      },
      {
        path: 'matches/:id/result',
        name: 'admin-match-result',
        component: () => import('@/views/admin/MatchResultInputView.vue')
      },
      {
        path: 'matches/:id/squad',
        name: 'admin-match-squad',
        component: () => import('@/views/admin/MatchSquadView.vue')
      },
      {
        path: 'players',
        name: 'admin-players',
        component: () => import('@/views/admin/PlayerManageView.vue')
      },
      {
        path: 'allowed-emails',
        name: 'admin-allowed-emails',
        component: () => import('@/views/admin/AllowedEmailsView.vue')
      },
      {
        path: 'fees',
        name: 'admin-fees',
        component: () => import('@/views/admin/FeesView.vue')
      },
      {
        path: 'audit-logs',
        name: 'admin-audit-logs',
        component: () => import('@/views/admin/AuditLogsView.vue')
      }
    ]
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
    pushToast('관리자만 접근할 수 있습니다.', 'error')
    return { path: '/' }
  }
  if (to.name === 'login' && authStore.isAuthed) {
    return { path: '/' }
  }
})

export default router
