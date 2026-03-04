<template>
  <Teleport to="body">
    <div v-if="isOpen"
      class="fixed z-[9999] flex flex-col rounded-xl shadow-2xl border border-slate-700/80 overflow-hidden"
      :class="{ 'transition-[left,top] duration-150': !isDragging }" :style="{
        left: pos.x + 'px',
        top: pos.y + 'px',
        width: isMinimized ? '280px' : size.w + 'px',
        height: isMinimized ? '44px' : size.h + 'px',
        maxHeight: '90vh',
        maxWidth: '98vw',
        backgroundColor: '#0e1117',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)'
      }">

      <!-- ── Title Bar ─────────────────────────────────────────────── -->
      <div class="flex items-center justify-between px-3 py-2 select-none cursor-move shrink-0"
        style="background: linear-gradient(135deg, #1a1f2e 0%, #161b27 100%); border-bottom: 1px solid rgba(255,255,255,0.05);"
        @mousedown="startDrag">

        <div class="flex items-center gap-2.5">
          <!-- macOS traffic lights -->
          <div class="flex gap-1.5 shrink-0">
            <button @click.stop="$emit('close')"
              class="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors flex items-center justify-center group"
              title="Close">
              <span class="hidden group-hover:block text-[7px] text-red-900 font-bold leading-none">✕</span>
            </button>
            <button @click.stop="isMinimized = !isMinimized"
              class="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors flex items-center justify-center group"
              title="Minimize">
              <span class="hidden group-hover:block text-[7px] text-yellow-900 font-bold leading-none">−</span>
            </button>
            <div class="w-3 h-3 rounded-full bg-green-600 opacity-40 cursor-default"></div>
          </div>

          <span class="text-[11px] font-mono text-slate-400 tracking-widest">
            ⬛ <span class="text-slate-200 font-semibold">{{ appName }}</span>
          </span>
        </div>

        <!-- Status badge -->
        <div v-if="!isMinimized" class="flex items-center gap-1.5">
          <div class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50"></div>
          <span class="text-[9px] text-emerald-400 font-mono tracking-widest uppercase">live</span>
        </div>
      </div>

      <!-- ── Tabs ──────────────────────────────────────────────────── -->
      <div v-show="!isMinimized" class="flex items-center shrink-0 px-3 gap-0.5"
        style="background: #13171f; border-bottom: 1px solid rgba(255,255,255,0.06);">
        <button v-for="tab in TABS" :key="tab.id" @click="currentTab = tab.id"
          class="relative px-3.5 py-2.5 text-[11px] font-semibold transition-all" :class="currentTab === tab.id
            ? 'text-white'
            : 'text-slate-500 hover:text-slate-300'">
          <span class="relative z-10 flex items-center gap-1.5">
            <span>{{ tab.label }}</span>
            <span v-if="tab.id !== 'pm2' && categorizedLogs[tab.id]?.length"
              class="px-1 py-0.5 rounded text-[9px] leading-none font-bold"
              :class="currentTab === tab.id ? 'bg-slate-600 text-slate-200' : 'bg-slate-800 text-slate-500'">
              {{ categorizedLogs[tab.id].length }}
            </span>
            <span v-if="tab.id === 'pm2' && pm2Logs.length"
              class="px-1 py-0.5 rounded text-[9px] leading-none font-bold"
              :class="currentTab === tab.id ? 'bg-blue-600/70 text-blue-100' : 'bg-slate-800 text-slate-500'">
              {{ pm2Logs.length }}
            </span>
          </span>
          <!-- Active tab underline -->
          <span v-if="currentTab === tab.id" class="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
            :style="{ background: tab.accent }"></span>
        </button>

        <!-- Spacer + Actions -->
        <div class="ml-auto flex items-center gap-1 py-1">
          <button @click="clearCurrentTab" title="Clear"
            class="p-1 rounded text-slate-600 hover:text-slate-300 hover:bg-slate-700/50 transition-colors">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <button @click="copyCurrentTab" title="Copy all"
            class="p-1 rounded text-slate-600 hover:text-slate-300 hover:bg-slate-700/50 transition-colors">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button @click="autoScroll = !autoScroll" :title="autoScroll ? 'Disable auto-scroll' : 'Enable auto-scroll'"
            class="p-1 rounded transition-colors"
            :class="autoScroll ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-600 hover:text-slate-300 hover:bg-slate-700/50'">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      </div>

      <!-- ── Log Area ──────────────────────────────────────────────── -->
      <div v-show="!isMinimized" ref="logContainer" class="flex-1 overflow-y-auto font-mono text-xs leading-relaxed"
        style="background: #0a0d12;" @scroll="onScroll">

        <!-- Empty state -->
        <div v-if="currentDisplayLogs.length === 0"
          class="flex flex-col items-center justify-center h-full text-slate-700 select-none">
          <svg class="w-8 h-8 mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-[11px]">{{ currentTab === 'pm2' ? 'No PM2 output yet' : 'No events yet' }}</p>
        </div>

        <!-- Log lines -->
        <div v-else class="p-3 space-y-0">
          <div v-for="(entry, idx) in currentDisplayLogs" :key="idx"
            class="group flex items-start gap-2 py-px hover:bg-white/[0.02] px-1 rounded"
            :class="getLineClass(entry.text)">
            <!-- Line number -->
            <span
              class="shrink-0 text-slate-700 text-[10px] w-7 text-right mt-px select-none group-hover:text-slate-500 transition-colors">
              {{ idx + 1 }}
            </span>
            <!-- Timestamp -->
            <span class="shrink-0 text-slate-600 text-[10px] mt-px select-none whitespace-nowrap" :title="entry.ts">
              {{ formatTs(entry.ts) }}
            </span>
            <!-- Text -->
            <span class="break-words whitespace-pre-wrap flex-1">{{ entry.text }}</span>
          </div>
        </div>
      </div>

      <!-- ── Resize Handle ─────────────────────────────────────────── -->
      <div v-show="!isMinimized"
        class="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-30 hover:opacity-70 transition-opacity"
        @mousedown.prevent="startResize">
        <svg viewBox="0 0 10 10" class="w-full h-full text-slate-400" fill="currentColor">
          <path d="M7 0l3 3v-3zM3 4l6 6h-3l-6-6zM0 7l3 3h-3z" />
        </svg>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick, onUnmounted, computed } from 'vue'
import { io } from 'socket.io-client'

// ─── Props & Emits ───────────────────────────────────────────────────────────
const props = defineProps({ isOpen: Boolean, appId: String, appName: String })
const emit = defineEmits(['close'])

// ─── State ───────────────────────────────────────────────────────────────────
const eventLogs = ref([])   // deploy events (Event Log + Build Script tabs)
const pm2Logs = ref([])   // PM2 native stdout/stderr (PM2 Logs tab)
const logContainer = ref(null)
const isMinimized = ref(false)
const isDragging = ref(false)
const isResizing = ref(false)
const currentTab = ref('events')
const autoScroll = ref(true)
const pos = ref({ x: Math.max(0, window.innerWidth - 860), y: Math.max(0, window.innerHeight - 560) })
const size = ref({ w: 840, h: 540 })
let socket = null
const MAX_LINES = 500

const TABS = [
  { id: 'events', label: 'Event Log', accent: '#6366f1' },
  { id: 'build', label: 'Build Script', accent: '#f59e0b' },
  { id: 'pm2', label: 'PM2 Logs', accent: '#10b981' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
const makeEntry = (text) => ({ text: String(text).trim(), ts: new Date().toISOString() })

const formatTs = (iso) => {
  const d = new Date(iso)
  const p = (n) => n.toString().padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

const getLineClass = (text) => {
  if (text.includes('[pm2me]') || text.includes('[SYSTEM]')) return 'text-indigo-400'
  if (text.startsWith('[stderr]') || /error|fail|exception/i.test(text)) return 'text-red-400'
  if (/success|done|complet|onlin/i.test(text)) return 'text-emerald-400'
  if (/warn/i.test(text)) return 'text-yellow-400'
  if (/start|clone|sync|pull|build|deploy/i.test(text)) return 'text-sky-400'
  return 'text-slate-300'
}

const pushEntry = (arr, text) => {
  const lines = String(text).split('\n').map(l => l.trim()).filter(Boolean)
  for (const line of lines) {
    arr.value.push(makeEntry(line))
    if (arr.value.length > MAX_LINES) arr.value.shift()
  }
}

const scrollToBottom = () => {
  if (!autoScroll.value) return
  nextTick(() => {
    if (logContainer.value) logContainer.value.scrollTop = logContainer.value.scrollHeight
  })
}

const onScroll = () => {
  if (!logContainer.value) return
  const { scrollTop, scrollHeight, clientHeight } = logContainer.value
  autoScroll.value = scrollHeight - scrollTop - clientHeight < 80
}

// ─── Log Categorization ──────────────────────────────────────────────────────
const categorizedLogs = computed(() => {
  const result = { events: [], build: [] }
  let inBuild = false

  for (const entry of eventLogs.value) {
    if (entry.text.includes('Executing Build Script')) { inBuild = true; result.build.push(entry); continue }
    if (entry.text.includes('Build Script Completed')) { result.build.push(entry); inBuild = false; continue }
    if (inBuild) { result.build.push(entry) } else { result.events.push(entry) }
  }
  return result
})

const currentDisplayLogs = computed(() => {
  if (currentTab.value === 'pm2') return pm2Logs.value
  return categorizedLogs.value[currentTab.value] || []
})

// ─── Actions ─────────────────────────────────────────────────────────────────
const clearCurrentTab = () => {
  if (currentTab.value === 'pm2') pm2Logs.value = []
  else eventLogs.value = []
}

const copyCurrentTab = () => {
  const text = currentDisplayLogs.value.map(e => `[${formatTs(e.ts)}] ${e.text}`).join('\n')
  navigator.clipboard.writeText(text).catch(() => { })
}

// ─── Dragging ────────────────────────────────────────────────────────────────
const startDrag = (e) => {
  if (e.target.tagName === 'BUTTON') return
  isDragging.value = true
  const ox = e.clientX - pos.value.x, oy = e.clientY - pos.value.y
  const move = (e) => {
    pos.value.x = Math.max(0, Math.min(e.clientX - ox, window.innerWidth - 80))
    pos.value.y = Math.max(0, Math.min(e.clientY - oy, window.innerHeight - 44))
  }
  const up = () => { isDragging.value = false; document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up) }
  document.addEventListener('mousemove', move)
  document.addEventListener('mouseup', up)
}

const startResize = (e) => {
  isResizing.value = true
  const ox = e.clientX - size.value.w, oy = e.clientY - size.value.h
  const move = (e) => {
    size.value.w = Math.max(480, e.clientX - ox)
    size.value.h = Math.max(300, e.clientY - oy)
  }
  const up = () => { isResizing.value = false; document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up) }
  document.addEventListener('mousemove', move)
  document.addEventListener('mouseup', up)
}

// ─── Load & Socket watcher ────────────────────────────────────────────────────
watch(() => props.isOpen, async (open) => {
  if (open && props.appId) {
    // Reset
    eventLogs.value = []
    pm2Logs.value = []
    currentTab.value = 'events'
    autoScroll.value = true

    // Keep position in bounds
    pos.value.x = Math.min(pos.value.x, window.innerWidth - 80)
    pos.value.y = Math.min(pos.value.y, window.innerHeight - 44)

    // 1️⃣  Historical deploy events (Event Log + Build Script tabs)
    try {
      const res = await fetch(`/api/deploy/${props.appId}/logs`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pm2me_token')}` }
      })
      if (res.ok) {
        const text = await res.text()
        text.split('\n').filter(l => l.trim()).forEach(l => pushEntry(eventLogs, l))
        scrollToBottom()
      }
    } catch { }

    // 2️⃣  Historical PM2 logs (PM2 Logs tab)
    try {
      const res = await fetch(`/api/apps/${props.appId}/pm2-logs`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pm2me_token')}` }
      })
      if (res.ok) {
        const text = await res.text()
        text.split('\n').filter(l => l.trim()).forEach(l => pushEntry(pm2Logs, l))
      }
    } catch { }

    // 3️⃣  Real-time via socket — two separate channels
    socket = io()

    socket.on(`deploy-log-${props.appId}`, (msg) => {
      pushEntry(eventLogs, msg)
      if (currentTab.value !== 'pm2') scrollToBottom()
    })

    socket.on(`pm2-log-${props.appId}`, (msg) => {
      pushEntry(pm2Logs, msg)
      if (currentTab.value === 'pm2') scrollToBottom()
    })

  } else {
    if (socket) { socket.disconnect(); socket = null }
  }
})

// Scroll to bottom on tab switch
watch(currentTab, () => { scrollToBottom() })

onUnmounted(() => { if (socket) socket.disconnect() })
</script>

<style scoped>
::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #2a2f3e;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #3d4459;
}
</style>
