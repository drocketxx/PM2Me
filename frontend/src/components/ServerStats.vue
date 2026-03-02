<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
    <!-- Network Stat -->
    <div class="bg-slate-800/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-700 shadow-lg group hover:border-purple-500/50 transition-all duration-300">
      <div class="flex items-center justify-between mb-2">
        <span class="text-slate-400 text-xs font-medium">Network</span>
        <div class="p-1.5 bg-purple-500/10 rounded-lg text-purple-400">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
      </div>
      <div class="flex flex-col space-y-1">
        <div class="flex items-center justify-between">
          <div class="flex items-center text-slate-400 text-[10px]">
            <svg class="w-3 h-3 mr-1 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            Down
          </div>
          <div class="text-sm font-bold text-white font-mono">{{ formatSpeed(stats.network.down) }}</div>
        </div>
        <div class="flex items-center justify-between">
          <div class="flex items-center text-slate-400 text-[10px]">
            <svg class="w-3 h-3 mr-1 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            Up
          </div>
          <div class="text-sm font-bold text-white font-mono">{{ formatSpeed(stats.network.up) }}</div>
        </div>
      </div>
    </div>
    <!-- CPU Stat -->
    <div class="bg-slate-800/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-700 shadow-lg group hover:border-blue-500/50 transition-all duration-300">
      <div class="flex items-center justify-between mb-3">
        <span class="text-slate-400 text-sm font-medium">Processor</span>
        <div class="p-2 bg-blue-500/10 rounded-lg text-blue-400">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        </div>
      </div>
      <div class="flex items-end justify-between">
        <div>
          <div class="text-2xl font-bold text-white tracking-tight">{{ stats.cpu.usage.toFixed(1) }}%</div>
          <div class="text-xs text-slate-500 mt-1 truncate max-w-[150px]">{{ stats.cpu.model }}</div>
        </div>
        <div class="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div class="h-full bg-blue-500 rounded-full transition-all duration-500" :style="{ width: stats.cpu.usage + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- RAM Stat -->
    <div class="bg-slate-800/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-700 shadow-lg group hover:border-emerald-500/50 transition-all duration-300">
      <div class="flex items-center justify-between mb-3">
        <span class="text-slate-400 text-sm font-medium">Memory (RAM)</span>
        <div class="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      <div class="flex items-end justify-between">
        <div>
          <div class="text-2xl font-bold text-white tracking-tight">{{ stats.memory.percentage.toFixed(1) }}%</div>
          <div class="text-xs text-slate-500 mt-1">{{ formatBytes(stats.memory.used) }} / {{ formatBytes(stats.memory.total) }}</div>
        </div>
        <div class="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div class="h-full bg-emerald-500 rounded-full transition-all duration-500" :style="{ width: stats.memory.percentage + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- Disk Stat -->
    <div class="bg-slate-800/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-700 shadow-lg group hover:border-orange-500/50 transition-all duration-300">
      <div class="flex items-center justify-between mb-3">
        <span class="text-slate-400 text-sm font-medium">{{ storageLabel }}</span>
        <div class="p-2 bg-orange-500/10 rounded-lg text-orange-400">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
        </div>
      </div>
      <div class="flex items-end justify-between">
        <div>
          <div class="text-2xl font-bold text-white tracking-tight">{{ stats.disk.percentage.toFixed(1) }}%</div>
          <div class="text-xs text-slate-500 mt-1">{{ formatBytes(stats.disk.used) }} / {{ formatBytes(stats.disk.total) }}</div>
        </div>
        <div class="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div class="h-full bg-orange-500 rounded-full transition-all duration-500" :style="{ width: stats.disk.percentage + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- Uptime Stat -->
    <div class="bg-slate-800/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-700 shadow-lg group hover:border-indigo-500/50 transition-all duration-300">
      <div class="flex items-center justify-between mb-3">
        <span class="text-slate-400 text-sm font-medium">System Uptime</span>
        <div class="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      <div class="flex flex-col">
        <div class="text-2xl font-bold text-white tracking-tight">{{ formatUptime(stats.uptime) }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ stats.hostname }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { io } from 'socket.io-client'

const stats = ref({
  platform: 'linux',
  cpu: { usage: 0, model: 'Loading...', cores: 0 },
  memory: { total: 0, free: 0, used: 0, percentage: 0 },
  disk: { total: 0, free: 0, used: 0, percentage: 0 },
  network: { down: 0, up: 0 },
  uptime: 0,
  hostname: '...'
})

const storageLabel = computed(() => {
  return stats.value.platform === 'win32' ? 'Storage (C:)' : 'Storage (/)'
})

let socket = null

const fetchStats = async () => {
  try {
    const res = await fetch('/api/system/stats', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('pm2me_token')}` }
    })
    if (res.ok) {
      stats.value = await res.json()
    }
  } catch (e) {
    console.error('Failed to fetch system stats', e)
  }
}

const formatSpeed = (bytesPerSecond) => {
  if (bytesPerSecond === 0) return '0 B/s'
  const k = 1024
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s']
  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k))
  return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatUptime = (seconds) => {
  const d = Math.floor(seconds / (3600 * 24))
  const h = Math.floor(seconds % (3600 * 24) / 3600)
  const m = Math.floor(seconds % 3600 / 60)
  
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

onMounted(() => {
  fetchStats()
  
  // Connect to the same host as the dashboard
  socket = io(window.location.origin)
  
  socket.on('system-stats', (newStats) => {
    stats.value = newStats
  })

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err)
  })
})

onUnmounted(() => {
  if (socket) socket.disconnect()
})
</script>
