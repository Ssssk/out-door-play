<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const pending = ref(false)
const form = reactive({ username: '', password: '' })

async function submit() {
  pending.value = true
  try {
    await auth.login(form.username, form.password)
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : '/'
    await router.replace(redirect)
  } catch {
    ElMessage.error('用户名或密码错误，或尝试过于频繁')
  } finally { pending.value = false }
}
</script>

<template>
  <main class="login-page">
    <section class="login-card" aria-labelledby="login-title">
      <div class="login-brand"><span class="brand__mark">粗</span><span>粗门溜溜运营后台</span></div>
      <h1 id="login-title">管理员登录</h1>
      <p>使用受授权的运营账号继续。会话凭证不会保存在浏览器脚本存储中。</p>
      <el-form label-position="top" @submit.prevent="submit">
        <el-form-item label="用户名"><el-input v-model="form.username" autocomplete="username" maxlength="64" /></el-form-item>
        <el-form-item label="密码"><el-input v-model="form.password" type="password" autocomplete="current-password" maxlength="128" show-password @keyup.enter="submit" /></el-form-item>
        <el-button class="login-submit" type="primary" native-type="submit" :loading="pending" :disabled="form.username.length < 3 || form.password.length < 12">登录</el-button>
      </el-form>
    </section>
  </main>
</template>
