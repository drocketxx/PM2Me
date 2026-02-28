<template>
  <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md" v-if="isOpen">
    <div
      class="bg-black rounded-lg shadow-2xl border border-slate-700 w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden ring-1 ring-slate-800">
      <div class="flex items-center justify-between p-3 bg-slate-800/80 border-b border-slate-700">
        <div class="flex items-center space-x-3">
          <div class="flex space-x-1.5">
            <div class="w-3 h-3 rounded-full bg-red-500"></div>
            <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div class="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span class="text-xs font-mono text-slate-400 ml-4 font-semibold tracking-wider">console : {{ appName
          }}</span>
        </div>
        <button @click="$emit('close')" class="text-slate-400 hover:text-white transition-colors">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed custom-scrollbar bg-black"
        ref="logContainer">
        <div v-for="(log, idx) in logs" :key="idx" :class="{
          'text-green-400': log.includes('successfully') || log.includes('Done'),
          'text-red-400': log.toLowerCase().includes('err') || log.toLowerCase().includes('fail'),
          'text-blue-400': log.includes('Starting') || log.includes('Cloning'),
          'text-slate-300': !log.toLowerCase().includes('err') && !log.includes('successfully') && !log.includes('Starting')
        }" class="break-words whitespace-pre-wrap">
          <span class="text-slate-600 opacity-50 select-none mr-2">[{{ new Date().toLocaleTimeString() }}]</span>{{ log
          }}
        </div>
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
let socket = null

watch(() => props.isOpen, (newVal) => {
  if (newVal && props.appId) {
    logs.value = []

    // Fetch historical logs first
    fetch(`http://localhost:12345/api/deploy/${props.appId}/logs`, {
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
        socket = io('http://localhost:12345')
        socket.on(`deploy-log-${props.appId}`, (msg) => {
          logs.value.push(msg.trim())
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
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #000;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
