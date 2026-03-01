<template>
  <div v-if="isOpen"
    class="fixed z-[60] flex flex-col shadow-2xl border border-slate-700 overflow-hidden ring-1 ring-slate-800"
    :class="{ 'transition-all duration-300': !isDragging }" :style="{
      left: pos.x + 'px',
      top: pos.y + 'px',
      width: isMinimized ? '300px' : '800px',
      height: isMinimized ? '44px' : '500px',
      maxHeight: '90vh',
      maxWidth: '95vw',
      'will-change': 'left, top'
    }">
    <!-- Header / Draggable Area -->
    <div
      class="flex items-center justify-between p-3 bg-slate-800/90 backdrop-blur-md border-b border-slate-700 cursor-move select-none"
      @mousedown="startDrag">
      <div class="flex items-center space-x-3 overflow-hidden">
        <div class="flex space-x-1.5 flex-shrink-0">
          <div class="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-900/50"></div>
          <div class="w-3 h-3 rounded-full bg-yellow-500 shadow-sm shadow-yellow-900/50"></div>
          <div class="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-900/50"></div>
        </div>
        <span class="text-[10px] font-mono text-slate-400 font-bold tracking-widest truncate uppercase">
          console : {{ appName }}
        </span>
      </div>
      <div class="flex items-center space-x-1 ml-4">
        <button @click="isMinimized = !isMinimized"
          class="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"
          title="Minimize/Expand">
          <svg v-if="!isMinimized" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
          </svg>
          <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
        <button @click="$emit('close')"
          class="p-1 hover:bg-red-500/20 rounded transition-colors text-slate-400 hover:text-red-400" title="Close">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Log Content (Hidden when minimized) -->
    <div v-show="!isMinimized"
      class="flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed custom-scrollbar bg-black" ref="logContainer">
      <div v-for="(log, idx) in logs" :key="idx" :class="{
        'text-emerald-400 font-bold': log.includes('successfully') || log.includes('Done') || log.includes('Completed'),
        'text-red-400': log.toLowerCase().includes('err') || log.toLowerCase().includes('fail'),
        'text-indigo-400 font-bold tracking-tight': log.includes('[SYSTEM]') || log.includes('[pm2me]'),
        'text-blue-400': log.includes('Starting') || log.includes('Cloning') || log.includes('Synchronizing'),
        'text-slate-300': !log.toLowerCase().includes('err') && !log.includes('successfully') && !log.includes('[SYSTEM]') && !log.includes('[pm2me]') && !log.includes('Starting')
      }" class="break-words whitespace-pre-wrap py-0.5 border-b border-slate-900/50 last:border-0">
        <span class="text-slate-600 opacity-50 select-none mr-2">[{{ new Date().toLocaleTimeString() }}]</span>{{ log }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { io } from 'socket.io-client'

const props = defineProps({
  isOpen: Boolean,
  appId: String,
  appName: String
})
const emit = defineEmits(['close'])

const logs = ref([])
const logContainer = ref(null)
const isMinimized = ref(false)
const isDragging = ref(false)
const pos = ref({ x: window.innerWidth - 850, y: window.innerHeight - 550 })
let socket = null

const startDrag = (e) => {
  isDragging.value = true
  const startX = e.clientX - pos.value.x
  const startY = e.clientY - pos.value.y

  const onMouseMove = (e) => {
    let newX = e.clientX - startX
    let newY = e.clientY - startY

    // Bounds checking
    const margin = 20
    const windowWidth = isMinimized.value ? 300 : 800
    const windowHeight = isMinimized.value ? 44 : 500

    newX = Math.max(-windowWidth + margin, Math.min(newX, window.innerWidth - margin))
    newY = Math.max(0, Math.min(newY, window.innerHeight - margin))

    pos.value.x = newX
    pos.value.y = newY
  }

  const onMouseUp = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

watch(() => props.isOpen, (newVal) => {
  if (newVal && props.appId) {
    logs.value = []

    // Reset position if out of bounds or just to be safe
    if (pos.value.x < 0 || pos.value.x > window.innerWidth - 100) {
      pos.value.x = window.innerWidth - (isMinimized.value ? 350 : 850)
    }
    if (pos.value.y < 0 || pos.value.y > window.innerHeight - 100) {
      pos.value.y = window.innerHeight - (isMinimized.value ? 100 : 550)
    }

    // Fetch historical logs first
    fetch(`/api/deploy/${props.appId}/logs`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('pm2me_token')}` }
    })
      .then(res => res.text())
      .then(text => {
        if (text) {
          logs.value = text.split('\n').filter(l => l.trim())
          nextTick(() => {
            if (logContainer.value) logContainer.value.scrollTop = logContainer.value.scrollHeight
          })
        }

        // Connect socket for realtime updates
        socket = io()
        socket.on(`deploy-log-${props.appId}`, (msg) => {
          let logMsg = msg;
          if (typeof msg !== 'string') {
            try {
              logMsg = new TextDecoder().decode(msg);
            } catch (e) {
              logMsg = String(msg);
            }
          }
          logs.value.push(logMsg.trim())
          nextTick(() => {
            if (logContainer.value) {
              logContainer.value.scrollTop = logContainer.value.scrollHeight
            }
          })
        })
      })
      .catch(err => console.error('Failed to fetch deploy logs', err))
  } else {
    if (socket) {
      socket.disconnect()
      socket = null
    }
  }
})

onUnmounted(() => {
  if (socket) socket.disconnect()
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #000;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #222;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #444;
}
</style>
