import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
// JS 调用的组件（ElMessage/ElMessageBox/ElNotification）走手动 import，绕过了
// ElementPlusResolver 的按需样式注入，必须全局引入完整样式，否则弹窗无样式
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './styles/main.css'
import { pinia } from './stores/pinia'
import { useAuthStore } from './stores/auth'
import { configureAuthTransport } from './api/client'

const auth = useAuthStore(pinia)
let redirecting = false
configureAuthTransport({ onUnauthorized: () => {
  auth.clearSession()
  if (!redirecting && router.currentRoute.value.name !== 'Login') {
    redirecting = true
    void router.replace({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } }).finally(() => { redirecting = false })
  }
} })

createApp(App).use(pinia).use(router).use(ElementPlus).mount('#app')
