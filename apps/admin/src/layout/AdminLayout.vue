<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { DataAnalysis, Location, MapLocation, Postcard, User } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
// 运营确认的五个入口；隐藏的功能保留路由和服务端权限检查。
const allMenus = [
  { group: '用户与内容', items: [
    { path: '/users', label: '用户管理', icon: User, permission: 'user:read' },
  ] },
  { group: '路线运营', items: [
    { path: '/routes', label: '路线列表', icon: MapLocation, permission: 'route:read' },
    { path: '/rankings', label: '热门榜单配置', icon: DataAnalysis, permission: 'ranking:read' },
    { path: '/cities', label: '城市管理', icon: Location, permission: 'city:read' },
  ] },
  { group: '系统配置', items: [
    { path: '/system-config', label: '上传二维码', icon: Postcard, permission: 'config:read' },
  ] },
]
const menus = computed(() => allMenus.map((section) => ({ ...section, items: section.items.filter((item) => auth.hasPermission(item.permission)) })).filter((section) => section.items.length))
const activePath = computed(() => route.path)
// 环境徽标按构建模式自动显示，避免线上误显「本地环境」造成「部署未生效」的误判
const envLabel = import.meta.env.PROD ? '生产环境' : '开发环境'
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
        <div><span class="env-badge" :class="{ prod: envLabel === '生产环境' }">{{ envLabel }}</span><span class="topbar__hint">数据与小程序实时同源</span></div>
        <div class="operator"><span class="operator__avatar">{{ auth.actor?.displayName.slice(0, 1) }}</span><div><strong>{{ auth.actor?.displayName }}</strong><small>{{ auth.actor?.roles.join(' · ') }}</small></div><el-button text @click="logout">退出</el-button></div>
      </div>
      <div class="content"><RouterView /></div>
    </main>
  </div>
</template>
