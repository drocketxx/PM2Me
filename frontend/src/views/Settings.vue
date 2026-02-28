<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-white tracking-tight mb-8">Settings</h1>

    <div class="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
      <div class="p-6 border-b border-slate-700">
        <h2 class="text-xl font-bold text-white flex items-center">
          <svg class="w-6 h-6 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          System Configurations
        </h2>
        <p class="text-sm text-slate-400 mt-1">Configure Webhooks and Integrations</p>
      </div>

      <div class="p-6 space-y-6">
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Connected GitHub Accounts</label>
          <div class="space-y-3 mb-4">
             <div v-for="acc in githubAccounts" :key="acc.id" class="flex items-center justify-between p-3 bg-slate-900 border border-slate-700 rounded-lg">
                <div class="flex items-center space-x-3">
                   <img :src="acc.avatarUrl" :alt="acc.username" class="w-8 h-8 rounded-full border border-slate-600">
                   <span class="text-white font-medium">@{{ acc.username }}</span>
                </div>
                <button type="button" @click="disconnectAccount(acc.id)" class="text-sm text-red-400 hover:text-red-300 transition-colors">Disconnect</button>
             </div>
             <p v-if="githubAccounts.length === 0" class="text-sm text-slate-500 italic">No accounts connected yet.</p>
          </div>

          <label class="block text-sm font-medium text-slate-300 mb-2">Add New Account (Personal Access Token)</label>
          <div class="flex gap-2">
             <input type="password" v-model="newToken" class="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx">
             <button type="button" @click="connectGitHubAccount" :disabled="isConnecting" class="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors border border-slate-600 disabled:opacity-50 whitespace-nowrap font-medium flex items-center">
                <svg v-if="isConnecting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span v-if="isConnecting">Testing...</span>
                <span v-else>Connect</span>
             </button>
          </div>
          <p class="mt-1 text-xs text-slate-500">Used to fetch repositories and branches automatically when deploying.</p>
        </div>

        <hr class="border-slate-700">

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">GitHub Webhook Secret</label>
          <input type="password" v-model="settings.webhookSecret" class="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="Secret for verifying GitHub payloads">
          <p class="mt-1 text-xs text-slate-500">Configure this in your GitHub repo settings payload URL: <code>http://your-server:12345/api/webhook</code></p>
        </div>

        <hr class="border-slate-700">

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Discord Webhook URL</label>
          <input type="url" v-model="settings.discordWebhook" class="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="https://discord.com/api/webhooks/...">
        </div>

        <hr class="border-slate-700">

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Telegram Bot Token</label>
            <input type="password" v-model="settings.telegramBotToken" class="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Telegram Chat ID</label>
            <input type="text" v-model="settings.telegramChatId" class="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="-1001234567890">
          </div>
        </div>
      </div>

      <div class="p-6 border-t border-slate-700 bg-slate-800/50 flex justify-end">
        <button @click="saveSettings" :disabled="isSaving" class="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-lg transition-all shadow-lg flex items-center disabled:opacity-70">
           <svg v-if="isSaving" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
           <svg v-else class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
           Save Settings
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const settings = ref({
  webhookSecret: '',
  discordWebhook: '',
  telegramBotToken: '',
  telegramChatId: ''
})
const githubAccounts = ref([])
const isSaving = ref(false)
const isConnecting = ref(false)
const newToken = ref('')

const fetchAccounts = async () => {
  try {
    const res = await fetch('http://localhost:12345/api/git/accounts', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('pm2me_token')}` }
    })
    githubAccounts.value = await res.json()
  } catch (e) {
    console.error('Failed to load accounts')
  }
}

const connectGitHubAccount = async () => {
  if (!newToken.value) return
  isConnecting.value = true
  try {
    const res = await fetch('http://localhost:12345/api/git/accounts', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('pm2me_token')}`
      },
      body: JSON.stringify({ token: newToken.value })
    })
    const data = await res.json()
    if (data.success) {
      newToken.value = ''
      await fetchAccounts()
    } else {
      alert(data.error || 'Invalid GitHub Token')
    }
  } catch (e) {
    alert('Error connecting to GitHub')
  } finally {
    isConnecting.value = false
  }
}

const disconnectAccount = async (id) => {
  if(!confirm('Are you sure you want to disconnect this account?')) return;
  try {
    await fetch(`http://localhost:12345/api/git/accounts/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('pm2me_token')}` }
    })
    await fetchAccounts()
  } catch (e) {
    alert('Failed to delete account')
  }
}

const loadSettings = async () => {
  try {
    const res = await fetch('http://localhost:12345/api/settings', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('pm2me_token')}` }
    })
    const data = await res.json()
    settings.value = { ...settings.value, ...data }
  } catch(e) { console.error('Failed to load settings', e) }
}

const saveSettings = async () => {
  isSaving.value = true
  try {
    await fetch('http://localhost:12345/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('pm2me_token')}`
      },
      body: JSON.stringify(settings.value)
    })
    alert('Settings Saved Successfully')
  } catch(e) {
    alert('Failed to save settings')
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  loadSettings()
  fetchAccounts()
})
</script>
