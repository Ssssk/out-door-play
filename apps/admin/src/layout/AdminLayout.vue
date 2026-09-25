<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { DataAnalysis, Location, MapLocation, Menu, PieChart, Postcard, Tickets, User } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
// 导航分组与命名严格对齐 PRD（prototypes/web-dashboard.html 侧边栏）：
// 用户与内容 / 路线运营（路线列表、热门榜单配置、油价配置）/ 系统配置（上传二维码）/ 数据
// 注：合并 6931a2d/faf7c56 时保留 PRD 导航——加油站台账已移出侧边栏（油价配置页有入口），
// 油价配置为 PRD 正式页面（web-cities.md），不再隐藏。
const allMenus = [
  { group: '用户与内容', items: [
    { path: '/users', label: '用户管理', icon: User, permission: 'user:read' },
    { path: '/feeds', label: '评论与举报', icon: Menu, permission: 'feed:read' },
  ] },
  { group: '路线运营', items: [
    { path: '/routes', label: '路线列表', icon: MapLocation, permission: 'route:read' },
    { path: '/rankings', label: '热门榜单配置', icon: DataAnalysis, permission: 'ranking:read' },
    { path: '/cities', label: '油价配置', icon: Location, permission: 'city:read' },
  ] },
  { group: '系统配置', items: [
    { path: '/system-config', label: '上传二维码', icon: Postcard, permission: 'config:read' },
  ] },
  { group: '数据', items: [
    { path: '/analytics', label: '曝光与点击', icon: PieChart, permission: 'analytics:read' },
    { path: '/reports', label: '导出报表', icon: Tickets, permission: 'report:read' },
  ] },
]
const menus = computed(() => allMenus.map((section) => ({ ...section, items: section.items.filter((item) => auth.hasPermission(item.permission)) })).filter((section) => section.items.length))
const activePath = computed(() => route.path)
async function logout() { try { await auth.logout() } finally { await router.replace({ name: 'Login' }) } }
</script>

<template>
  <div class="admin-shell">
    <aside class="sidebar">
      <div class="brand">
        <span class="brand__mark">粗</span>
        <div><strong>粗门溜溜</strong><small>运营管理后台</small></div>
      </div>
      <nav>
        <section v-for="section in menus" :key="section.group" class="menu-group">
          <h2>{{ section.group }}</h2>
          <RouterLink v-for="item in section.items" :key="item.path" :to="item.path" class="menu-item" :class="{ active: activePath === item.path }">
            <el-icon><component :is="item.icon" /></el-icon><span>{{ item.label }}</span>
          </RouterLink>
        </section>
      </nav>
      <div class="sidebar__foot"><span class="online-dot" /> MySQL 已连接</div>
    </aside>
    <main class="workspace">
      <div class="topbar">
        <div><span class="env-badge">本地环境</span><span class="topbar__hint">数据与小程序实时同源</span></div>
        <div class="operator"><span class="operator__avatar">{{ auth.actor?.displayName.slice(0, 1) }}</span><div><strong>{{ auth.actor?.displayName }}</strong><small>{{ auth.actor?.roles.join(' · ') }}</small></div><el-button text @click="logout">退出</el-button></div>
      </div>
      <div class="content"><RouterView /></div>
    </main>
  </div>
</template>
