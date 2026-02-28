<template>
  <div class="min-h-screen bg-slate-900 text-slate-200 font-sans">
    <nav v-if="isAuthenticated" class="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <div class="flex items-center space-x-3">
            <div
              class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
              P
            </div>
            <span
              class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 cursor-pointer"
              @click="$router.push('/')">PM2Me</span>
          </div>
          <div class="flex items-center space-x-4">
            <button @click="$router.push('/settings')"
              class="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200">Settings</button>
            <button @click="logout"
              class="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200">Logout</button>
          </div>
        </div>
      </div>
    </nav>
    <main>
      <router-view></router-view>
    </main>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const isAuthenticated = ref(!!localStorage.getItem('pm2me_token'))

// Update auth state on route change (e.g. after login/logout navigation)
watch(route, () => {
  isAuthenticated.value = !!localStorage.getItem('pm2me_token')
})

const logout = () => {
  localStorage.removeItem('pm2me_token')
  isAuthenticated.value = false
  router.push('/login')
}
</script>

<style>
/* Global styles can go here if not in style.css */
</style>
