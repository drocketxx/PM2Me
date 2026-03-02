<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
            <svg class="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/>
            </svg>
          </div>
          Nginx
        </h1>
        <p class="text-sm text-slate-400 mt-1">Manage nginx configuration and process</p>
      </div>

      <!-- Status Badge -->
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium"
          :class="status.running
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-slate-800 border-slate-700 text-slate-400'">
          <span class="relative flex h-2 w-2">
            <span v-if="status.running" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2" :class="status.running ? 'bg-emerald-400' : 'bg-slate-500'"></span>
          </span>
          {{ status.running ? 'Running' : 'Stopped' }}
        </div>
        <button @click="refreshStatus" :disabled="status.checking"
          class="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800">
          <svg class="w-4 h-4" :class="{ 'animate-spin': status.checking }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Info Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-slate-800/60 rounded-2xl border border-slate-700 p-4">
        <p class="text-xs text-slate-500 mb-1">OS Platform</p>
        <p class="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <span class="text-lg">{{ info.os === 'windows' ? '🪟' : '🐧' }}</span>
          {{ info.os === 'windows' ? 'Windows' : 'Linux' }}
        </p>
      </div>
      <div class="bg-slate-800/60 rounded-2xl border border-slate-700 p-4">
        <p class="text-xs text-slate-500 mb-1">Nginx Version</p>
        <p class="text-sm font-semibold" :class="info.installed ? 'text-emerald-400' : 'text-red-400'">
          {{ info.installed ? `v${info.version}` : 'Not installed' }}
        </p>
      </div>
      <div class="bg-slate-800/60 rounded-2xl border border-slate-700 p-4">
        <p class="text-xs text-slate-500 mb-1">Config File</p>
        <p class="text-xs font-mono text-slate-300 break-all">{{ info.confFile }}</p>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="bg-slate-800/60 rounded-2xl border border-slate-700 p-5">
      <h2 class="text-sm font-semibold text-slate-300 mb-4">Process Control</h2>
      <div class="flex flex-wrap gap-3">
        <!-- Test / Check Syntax -->
        <button @click="runAction('test')" :disabled="actionLoading"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-400 disabled:opacity-50">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Test Config
        </button>
        <!-- Start -->
        <button @click="runAction('start')" :disabled="actionLoading || status.running"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-400 disabled:opacity-30">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Start
        </button>
        <!-- Reload -->
        <button @click="runAction('reload')" :disabled="actionLoading || !status.running"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/30 text-amber-400 disabled:opacity-30">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Reload
        </button>
        <!-- Quit (graceful) -->
        <button @click="runAction('quit')" :disabled="actionLoading || !status.running"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-300 disabled:opacity-30">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/>
          </svg>
          Quit (Graceful)
        </button>
        <!-- Stop (fast) -->
        <button @click="runAction('stop')" :disabled="actionLoading || !status.running"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-400 disabled:opacity-30">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
          Stop (Fast)
        </button>
        <div v-if="actionLoading" class="flex items-center gap-2 text-slate-400 text-sm">
          <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
          Running...
        </div>
      </div>

      <!-- Output Terminal -->
      <div v-if="actionOutput !== null" class="mt-4 rounded-xl bg-slate-900/80 border p-4 font-mono text-sm whitespace-pre-wrap"
        :class="actionSuccess ? 'border-emerald-500/30 text-emerald-300' : 'border-red-500/30 text-red-300'">
        <div class="flex items-center gap-2 mb-2 text-xs font-sans" :class="actionSuccess ? 'text-emerald-500' : 'text-red-500'">
          <svg v-if="actionSuccess" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
          <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
          {{ actionSuccess ? 'Success' : 'Error' }}
        </div>
        {{ actionOutput || '(no output)' }}
      </div>
    </div>

    <!-- Config Editor -->
    <div class="bg-slate-800/60 rounded-2xl border border-slate-700 overflow-hidden">
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-700">
        <div class="flex items-center gap-3">
          <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <span class="text-sm font-semibold text-slate-300">nginx.conf</span>
          <span class="text-xs font-mono text-slate-500">{{ info.confFile }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span v-if="configDirty" class="text-xs text-amber-400 flex items-center gap-1">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4"/></svg>
            Unsaved
          </span>
          <button @click="saveConfig" :disabled="savingConfig || !configDirty"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-40">
            <svg v-if="!savingConfig" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
            <svg v-else class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
            Save
          </button>
          <button @click="loadConfig"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 transition-all">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
            Reload
          </button>
        </div>
      </div>
      <div v-if="!configExists" class="px-5 py-4 text-sm text-amber-400 flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.75-2.96L13.75 4a2 2 0 00-3.5 0L3.25 16.04A2 2 0 005.07 19z"/></svg>
        Config file not found at <code class="font-mono ml-1">{{ info.confFile }}</code>. You can create it by editing and saving below.
      </div>
      <!-- Code editor (textarea) -->
      <textarea v-model="configContent" @input="configDirty = true" spellcheck="false"
        class="w-full bg-slate-900/50 text-slate-200 font-mono text-[13px] leading-relaxed p-5 focus:outline-none resize-none"
        style="min-height: 480px; tab-size: 4;"
        placeholder="# nginx.conf content will appear here..."></textarea>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const token = () => localStorage.getItem('pm2me_token')
const headers = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' })

const info = ref({ os: '', confFile: '', confDir: '', installed: false, version: '' })
const status = ref({ running: false, checking: false })
const configContent = ref('')
const configExists = ref(true)
const configDirty = ref(false)
const savingConfig = ref(false)
const actionLoading = ref(false)
const actionOutput = ref(null)
const actionSuccess = ref(false)

let statusInterval = null

const fetchInfo = async () => {
  const res = await fetch('/api/nginx/info', { headers: headers() })
  info.value = await res.json()
}

const refreshStatus = async () => {
  status.value.checking = true
  try {
    const res = await fetch('/api/nginx/status', { headers: headers() })
    const data = await res.json()
    status.value.running = data.running
  } finally {
    status.value.checking = false
  }
}

const loadConfig = async () => {
  const res = await fetch('/api/nginx/config', { headers: headers() })
  const data = await res.json()
  configContent.value = data.content
  configExists.value = data.exists
  configDirty.value = false
}

const saveConfig = async () => {
  savingConfig.value = true
  try {
    await fetch('/api/nginx/config', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ content: configContent.value })
    })
    configDirty.value = false
  } finally {
    savingConfig.value = false
  }
}

const runAction = async (action) => {
  actionLoading.value = true
  actionOutput.value = null
  try {
    const res = await fetch('/api/nginx/action', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ action })
    })
    const data = await res.json()
    actionOutput.value = data.output || data.error || ''
    actionSuccess.value = data.success
    // Refresh status after start/stop/reload/quit
    if (['start', 'reload', 'stop', 'quit'].includes(action)) {
      setTimeout(refreshStatus, 800)
    }
  } finally {
    actionLoading.value = false
  }
}

onMounted(async () => {
  await fetchInfo()
  await refreshStatus()
  await loadConfig()
  statusInterval = setInterval(refreshStatus, 5000)
})

onUnmounted(() => {
  clearInterval(statusInterval)
})
</script>
