import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
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

createApp(App).use(pinia).use(router).mount('#app')
