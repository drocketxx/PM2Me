<template>
  <div class="min-h-screen flex items-center justify-center px-4"
    style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
    <div class="w-full max-w-lg">

      <!-- Logo / Brand -->
      <div class="text-center mb-8">
        <div
          class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/30 mb-4">
          <svg class="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-white">PM2Me Setup</h1>
        <p class="text-slate-400 mt-1 text-sm">Configure your instance in a few steps</p>
      </div>

      <!-- Step Indicator -->
      <div class="flex items-center justify-center gap-2 mb-8">
        <div v-for="i in 2" :key="i" class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
            :class="step > i ? 'bg-emerald-500 text-white' : step === i ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-500'">
            <svg v-if="step > i" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
            <span v-else>{{ i }}</span>
          </div>
          <div v-if="i < 2" class="w-12 h-0.5 rounded" :class="step > i ? 'bg-emerald-500' : 'bg-slate-700'"></div>
        </div>
      </div>

      <!-- Card -->
      <div class="bg-slate-800/80 backdrop-blur-md rounded-3xl border border-slate-700 p-8 shadow-2xl">

        <!-- Step 1: Admin Password -->
        <div v-if="step === 1">
          <h2 class="text-xl font-semibold text-white mb-1">Admin Password</h2>
          <p class="text-slate-400 text-sm mb-6">Set a secure password for your PM2Me admin account.</p>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <input v-model="adminPassword" type="password" placeholder="Enter admin password"
                class="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                @keydown.enter="nextStep" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5">Confirm Password</label>
              <input v-model="adminPasswordConfirm" type="password" placeholder="Confirm password"
                class="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                @keydown.enter="nextStep" />
              <p v-if="passwordMismatch" class="text-red-400 text-xs mt-1">Passwords do not match</p>
            </div>
          </div>

          <div v-if="error" class="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{{
            error }}</div>

          <button @click="nextStep" :disabled="!adminPassword || passwordMismatch"
            class="mt-6 w-full py-3 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            Continue
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- Step 2: Apps Storage Path -->
        <div v-if="step === 2">
          <h2 class="text-xl font-semibold text-white mb-1">Apps Storage Path</h2>
          <p class="text-slate-400 text-sm mb-6">Where should PM2Me store your deployed apps?</p>

          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">Directory Path</label>
            <input v-model="appsPath" type="text" :placeholder="defaultPath"
              class="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-blue-500 transition-colors" />
            <p class="text-slate-500 text-xs mt-1.5">Directory will be created if it doesn't exist.</p>
          </div>

          <!-- Preset shortcuts -->
          <div class="flex flex-wrap gap-2 mt-4">
            <button v-for="preset in pathPresets" :key="preset" @click="appsPath = preset"
              class="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 font-mono transition-colors">
              {{ preset }}
            </button>
          </div>

          <div v-if="error" class="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{{
            error }}</div>

          <div class="flex gap-3 mt-6">
            <button @click="step = 1"
              class="px-4 py-3 rounded-xl text-sm text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 transition-all">
              Back
            </button>
            <button @click="completeSetup" :disabled="!appsPath || submitting"
              class="flex-1 py-3 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <svg v-if="submitting" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <template v-else>
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Complete Setup
              </template>
            </button>
          </div>
        </div>

      </div>

      <p class="text-center text-slate-600 text-xs mt-6">PM2Me v{{ version }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import os from 'os'

const router = useRouter()

const step = ref(1)
const adminPassword = ref('')
const adminPasswordConfirm = ref('')
const appsPath = ref('')
const submitting = ref(false)
const error = ref('')
const version = ref('1.0.0')

const passwordMismatch = computed(() =>
  adminPasswordConfirm.value.length > 0 && adminPassword.value !== adminPasswordConfirm.value
)

// OS-based defaults
const isWindows = navigator.userAgent.includes('Windows')
const defaultPath = isWindows ? 'C:\\pm2me\\apps' : '/opt/pm2me/apps'
const pathPresets = isWindows
  ? ['C:\\pm2me\\apps', 'C:\\Users\\apps', 'D:\\pm2me\\apps']
  : ['/opt/pm2me/apps', '/home/apps', '/var/pm2me/apps']

const nextStep = () => {
  error.value = ''
  if (!adminPassword.value) { error.value = 'Password is required'; return }
  if (passwordMismatch.value) { error.value = 'Passwords do not match'; return }
  appsPath.value = appsPath.value || defaultPath
  step.value = 2
}

const completeSetup = async () => {
  if (!appsPath.value) { error.value = 'Apps path is required'; return }
  submitting.value = true
  error.value = ''
  try {
    const res = await fetch('/api/setup/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPassword: adminPassword.value, appsPath: appsPath.value })
    })
    const data = await res.json()
    if (!res.ok) { error.value = data.error || 'Setup failed'; return }
    // Hard redirect so router re-checks setup status fresh
    window.location.href = '/login'
  } catch (e) {
    error.value = e.message
  } finally {
    submitting.value = false
  }
}
</script>
