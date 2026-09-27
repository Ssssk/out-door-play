import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '../layout/AdminLayout.vue'
import { useAuthStore } from '../stores/auth'
import { pinia } from '../stores/pinia'

const router = createRouter({
  history: createWebHistory('/admin/'),
  routes: [
    { path: '/login', name: 'Login', component: () => import('../views/LoginView.vue'), meta: { title: '管理员登录', public: true } },
    { path: '/forbidden', name: 'Forbidden', component: () => import('../views/ForbiddenView.vue'), meta: { title: '无权访问' } },
    {
    path: '/',
    component: AdminLayout,
    redirect: '/routes',
    children: [
      { path: 'routes', name: 'Routes', component: () => import('../views/RoutesView.vue'), meta: { title: '路线列表', group: '路线运营', permission: 'route:read' } },
      { path: 'rankings', name: 'Rankings', component: () => import('../views/RankingsView.vue'), meta: { title: '热门榜单配置', group: '路线运营', permission: 'ranking:read' } },
      { path: 'cities', name: 'Cities', component: () => import('../views/CitiesView.vue'), meta: { title: '城市管理', group: '路线运营', permission: 'city:read' } },
      // 加油站台账不在 PRD 侧边栏中，由「油价配置」页的「加油站与油价管理」入口进入
      { path: 'fuel', name: 'Fuel', component: () => import('../views/FuelView.vue'), meta: { title: '加油站与油价管理', group: '路线运营', permission: 'fuel:read' } },
      { path: 'users', name: 'Users', component: () => import('../views/UsersView.vue'), meta: { title: '用户管理', group: '用户与内容', permission: 'user:read' } },
      { path: 'feeds', name: 'Feeds', component: () => import('../views/FeedsView.vue'), meta: { title: '评论与举报', group: '用户与内容', permission: 'feed:read' } },
      { path: 'system-config', name: 'SystemConfig', component: () => import('../views/QrConfigView.vue'), meta: { title: '上传二维码', group: '系统配置', permission: 'config:read' } },
      { path: 'analytics', name: 'Analytics', component: () => import('../views/AnalyticsView.vue'), meta: { title: '曝光与点击', group: '数据', permission: 'analytics:read' } },
      { path: 'reports', name: 'Reports', component: () => import('../views/ReportsView.vue'), meta: { title: '导出报表', group: '数据', permission: 'report:read' } },
    ],
  }],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore(pinia)
  if (!auth.initialized) await auth.initialize()
  if (to.meta.public) return auth.authenticated ? { path: '/' } : true
  if (!auth.authenticated) return { name: 'Login', query: { redirect: to.fullPath } }
  const permission = typeof to.meta.permission === 'string' ? to.meta.permission : undefined
  if (!auth.hasPermission(permission) && to.name !== 'Forbidden') return { name: 'Forbidden' }
  return true
})

router.afterEach((to) => { document.title = `${String(to.meta.title || '运营后台')} · 粗门溜溜` })

export default router
