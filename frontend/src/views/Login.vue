<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div
      class="max-w-md w-full space-y-8 bg-slate-800 p-10 rounded-2xl shadow-2xl border border-slate-700/50 backdrop-blur-sm relative overflow-hidden">
      <!-- Decorative background glow -->
      <div
        class="absolute -top-10 -right-10 w-40 h-40 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse">
      </div>
      <div
        class="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse">
      </div>

      <div class="relative z-10 text-center">
        <div
          class="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-500/30 mb-6">
          P
        </div>
        <h2 class="mt-2 text-3xl font-extrabold text-white tracking-tight">PM2Me</h2>
        <p class="mt-2 text-sm text-slate-400">Sign in to manage your deployments</p>
      </div>
      <form class="relative z-10 mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="password" class="sr-only">Password</label>
            <input id="password" v-model="password" name="password" type="password" required
              class="appearance-none rounded-lg relative block w-full px-4 py-3 border border-slate-600 bg-slate-900/50 placeholder-slate-400 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 sm:text-sm"
              placeholder="Admin Password (or set initial)">
          </div>
        </div>

        <div v-if="errorMsg"
          class="text-red-400 text-sm text-center bg-red-400/10 py-2 rounded-lg border border-red-400/20">
          {{ errorMsg }}
        </div>

        <div>
          <button type="submit" :disabled="isLoading"
            class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-900 shadow-lg shadow-blue-500/30 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed">
            <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>
            <span v-else class="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg class="h-5 w-5 text-indigo-300 group-hover:text-indigo-200 transition-colors"
                xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clip-rule="evenodd" />
              </svg>
            </span>
            Sign in
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const password = ref('')
const errorMsg = ref('')
const isLoading = ref(false)

// Every time login page loads, verify setup is complete
onMounted(async () => {
  try {
    const res = await fetch('/api/setup/status')
    const data = await res.json()
    if (data.needsSetup) {
      window.location.href = '/setup'
    }
  } catch { }
})

const handleLogin = async () => {
  isLoading.value = true
  errorMsg.value = ''
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password.value })
    })
    const data = await res.json()
    if (res.ok && data.token) {
      localStorage.setItem('pm2me_token', data.token)
      router.push('/')
    } else {
      errorMsg.value = data.error || 'Login failed'
    }
  } catch (err) {
    errorMsg.value = 'Failed to connect to server'
  } finally {
    isLoading.value = false
  }
}
</script>
