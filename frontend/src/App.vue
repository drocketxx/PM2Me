<template>
  <div class="min-h-screen bg-slate-900 text-slate-200 font-sans">
    <nav v-if="isAuthenticated" class="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <div class="flex items-center space-x-3">
          <img src="/icon.png" alt="PM2Me" class="w-8 h-8 rounded-lg shadow-lg shadow-blue-500/30 cursor-pointer" @click="$router.push('/')" />
            <span
              class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 cursor-pointer"
              @click="$router.push('/')">PM2Me</span>
          </div>
          <div class="flex items-center space-x-1 sm:space-x-2">
            <button @click="$router.push('/')"
              :class="[
                'flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                $route.path === '/' 
                  ? 'bg-blue-600/10 text-blue-400 shadow-sm border border-blue-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              ]">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Home</span>
            </button>
            <button @click="$router.push('/settings')"
              :class="[
                'flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                $route.path === '/nginx' 
                  ? 'bg-blue-600/10 text-blue-400 shadow-sm border border-blue-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              ]"
              @click.prevent="$router.push('/nginx')">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/>
              </svg>
              <span>Nginx</span>
            </button>
            <button @click="$router.push('/settings')"
              :class="[
                'flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                $route.path === '/settings' 
                  ? 'bg-blue-600/10 text-blue-400 shadow-sm border border-blue-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              ]">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Settings</span>
            </button>
            <div class="w-px h-4 bg-slate-800 mx-1 hidden sm:block"></div>
            <button @click="logout"
              class="flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span class="hidden sm:inline">Logout</span>
            </button>
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
