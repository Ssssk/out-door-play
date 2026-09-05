<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="permission-state">
    <span>403</span><h1>当前账号无权访问</h1><p>权限由服务端策略控制。如需访问，请联系超级管理员调整角色。</p>
    <el-button type="primary" @click="router.push('/')">返回可访问页面</el-button>
  </div>
</template>
