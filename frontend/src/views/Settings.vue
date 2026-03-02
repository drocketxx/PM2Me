<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-white tracking-tight mb-8">Settings</h1>

    <div class="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
      <div class="p-6 border-b border-slate-700">
        <h2 class="text-xl font-bold text-white flex items-center">
          <svg class="w-6 h-6 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z">
            </path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z">
            </path>
          </svg>
          System Configurations
        </h2>
        <p class="text-sm text-slate-400 mt-1">Configure Webhooks and Integrations</p>
      </div>

      <div class="p-6 space-y-6">
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Connected GitHub Accounts</label>
          <div class="space-y-3 mb-4">
            <div v-for="acc in githubAccounts" :key="acc.id"
              class="flex items-center justify-between p-3 bg-slate-900 border border-slate-700 rounded-lg">
              <div class="flex items-center space-x-3">
                <img :src="acc.avatarUrl" :alt="acc.username" class="w-8 h-8 rounded-full border border-slate-600">
                <span class="text-white font-medium">@{{ acc.username }}</span>
              </div>
              <button type="button" @click="disconnectAccount(acc.id)"
                class="text-sm text-red-400 hover:text-red-300 transition-colors">Disconnect</button>
            </div>
            <p v-if="githubAccounts.length === 0" class="text-sm text-slate-500 italic">No accounts connected yet.</p>
          </div>

          <label class="block text-sm font-medium text-slate-300 mb-2">Add New Account (Personal Access Token)</label>
          <div class="flex gap-2">
            <input type="password" v-model="newToken"
              class="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx">
            <button type="button" @click="connectGitHubAccount" :disabled="isConnecting"
              class="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors border border-slate-600 disabled:opacity-50 whitespace-nowrap font-medium flex items-center">
              <svg v-if="isConnecting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none"
                viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              <span v-if="isConnecting">Testing...</span>
              <span v-else>Connect</span>
            </button>
          </div>
          <p class="mt-1 text-xs text-slate-500">Used to fetch repositories and branches automatically when deploying.
          </p>
        </div>

        <hr class="border-slate-700">

        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-slate-300">GitHub Webhook URL</label>
            <button @click="copyToClipboard(webhookUrl, 'URL')"
              class="text-xs text-blue-400 hover:text-blue-300 flex items-center transition-colors">
              <svg class="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              {{ copiedField === 'URL' ? 'Copied!' : 'Copy URL' }}
            </button>
          </div>
          <div class="relative">
            <input type="text" :value="webhookUrl" readonly
              class="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-400 text-sm font-mono outline-none transition-all cursor-default"
              placeholder="Calculating...">
          </div>
          <p class="mt-1 text-[11px] text-slate-500 italic">Provide this URL to your GitHub repository's Webhook
            settings.</p>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-slate-300">GitHub Webhook Secret</label>
            <div class="flex items-center space-x-3">
              <button @click="generateSecret"
                class="text-xs text-emerald-400 hover:text-emerald-300 flex items-center transition-colors">
                <svg class="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Generate
              </button>
              <button @click="copyToClipboard(settings.webhookSecret, 'Secret')"
                class="text-xs text-blue-400 hover:text-blue-300 flex items-center transition-colors">
                <svg class="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                {{ copiedField === 'Secret' ? 'Copied!' : 'Copy Secret' }}
              </button>
            </div>
          </div>
          <div class="relative">
            <input :type="showSecret ? 'text' : 'password'" v-model="settings.webhookSecret"
              class="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-12"
              placeholder="Secret for verifying GitHub payloads">
            <button @click="showSecret = !showSecret"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1">
              <svg v-if="showSecret" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.882 9.882L9.881 9.882M9.882 9.882A3.001 3.001 0 0014.15 14.15l-4.268-4.268zm7.665 7.665l2.484 2.484M15.904 15.904a10.023 10.023 0 01-3.904 1.096m-4.06-1.121A10.053 10.053 0 013 12c.5-2.015 1.581-3.76 3.061-5.061m10.878 10.878l-4.243-4.243m4.243 4.243L19 19m-4.732-4.732l-4.242-4.242M4.732 4.732L2 2" />
              </svg>
              <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>

          <!-- Webhook Setup Instructions -->
          <div class="mt-4 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-3">
            <h3 class="text-sm font-bold text-blue-400 flex items-center">
              <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How to setup GitHub Webhook
            </h3>
            <ol class="text-xs text-slate-400 space-y-2 list-decimal list-inside">
              <li>Open your repository on GitHub.</li>
              <li>Go to <span class="text-slate-200">Settings</span> > <span class="text-slate-200">Webhooks</span> >
                <span class="text-slate-200">Add webhook</span>.
              </li>
              <li>Payload URL: <span class="text-blue-300 font-mono">{{ webhookUrl }}</span></li>
              <li>Content type: <span class="text-orange-400 font-bold">application/json</span></li>
              <li>Secret: <span class="text-slate-200">Paste your Webhook Secret above</span></li>
              <li>Which events: <span class="text-slate-200">Just the push event</span>.</li>
            </ol>
            <p class="text-[10px] text-slate-500 italic">This allows PM2Me to automatically deploy your apps when you
              push code.</p>
          </div>
        </div>

        <hr class="border-slate-700">

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Discord Webhook URL</label>
          <input type="url" v-model="settings.discordWebhook"
            class="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="https://discord.com/api/webhooks/...">
        </div>

        <hr class="border-slate-700">

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Telegram Bot Token</label>
            <input type="password" v-model="settings.telegramBotToken"
              class="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Telegram Chat ID</label>
            <input type="text" v-model="settings.telegramChatId"
              class="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="-1001234567890">
          </div>
        </div>
      </div>

      <div class="p-6 border-t border-slate-700 bg-slate-800/50 flex justify-end">
        <button @click="saveSettings" :disabled="isSaving"
          class="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-lg transition-all shadow-lg flex items-center disabled:opacity-70">
          <svg v-if="isSaving" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
          <svg v-else class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          Save Settings
        </button>
      </div>
    </div>

    <!-- ── App Version / Update ─────────────────────── -->
    <div class="mt-8 bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
      <div class="p-6 border-b border-slate-700 flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            App Version
          </h2>
          <p class="text-sm text-slate-400 mt-1">Check for updates and manage the PM2Me version</p>
        </div>
        <button @click="checkUpdate" :disabled="checkingUpdate"
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 transition-all disabled:opacity-50">
          <svg class="w-4 h-4" :class="{ 'animate-spin': checkingUpdate }" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Check for Update
        </button>
      </div>
      <div class="p-6">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div class="bg-slate-900/60 rounded-xl p-4 border border-slate-700">
            <p class="text-xs text-slate-500 mb-1">Current Version</p>
            <p class="text-lg font-bold text-white font-mono">v{{ versionInfo.current || '...' }}</p>
          </div>
          <div class="bg-slate-900/60 rounded-xl p-4 border border-slate-700">
            <p class="text-xs text-slate-500 mb-1">Latest Release</p>
            <p class="text-lg font-bold font-mono"
              :class="versionInfo.hasUpdate ? 'text-amber-400' : 'text-emerald-400'">
              {{ versionInfo.latest ? 'v' + versionInfo.latest : '-' }}
            </p>
          </div>
          <div class="bg-slate-900/60 rounded-xl p-4 border border-slate-700 flex flex-col justify-center">
            <span v-if="versionInfo.hasUpdate"
              class="inline-flex items-center gap-1.5 text-amber-400 text-sm font-medium">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd" />
              </svg>
              Update available!
            </span>
            <span v-else-if="versionInfo.latest"
              class="inline-flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd" />
              </svg>
              Up to date
            </span>
            <span v-else-if="hasCheckedUpdate" class="text-slate-500 text-sm italic">
              No releases found on GitHub
            </span>
            <span v-else class="text-slate-500 text-sm">Not checked</span>
          </div>
        </div>

        <!-- Changelog snippet -->
        <div v-if="versionInfo.changelog" class="mb-4 p-4 bg-slate-900/60 rounded-xl border border-slate-700">
          <p class="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">Release Notes</p>
          <pre
            class="text-xs text-slate-300 whitespace-pre-wrap font-mono max-h-32 overflow-y-auto">{{ versionInfo.changelog }}</pre>
          <a v-if="versionInfo.releaseUrl" :href="versionInfo.releaseUrl" target="_blank"
            class="inline-flex items-center gap-1 mt-2 text-xs text-blue-400 hover:text-blue-300">
            View on GitHub →
          </a>
        </div>

        <!-- Update button -->
        <div v-if="versionInfo.hasUpdate" class="flex items-center gap-4">
          <button @click="runUpdate" :disabled="updating"
            class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-50">
            <svg v-if="updating" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {{ updating ? 'Updating...' : 'Update Now' }}
          </button>
          <p class="text-xs text-slate-500">Server will restart after update</p>
        </div>

        <!-- Update output -->
        <div v-if="updateOutput"
          class="mt-4 p-4 bg-slate-900/80 rounded-xl border border-slate-700 font-mono text-xs text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
          {{ updateOutput }}
        </div>
      </div>
    </div>

    <!-- Webhook History Section -->
    <div class="mt-8 bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
      <div class="p-6 border-b border-slate-700 flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-white flex items-center">
            <svg class="w-6 h-6 mr-2 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Webhook History
          </h2>
          <p class="text-sm text-slate-400 mt-1">Last 50 recorded events (Push, Ping, etc.)</p>
        </div>
        <button @click="fetchWebhookLogs" class="p-2 text-slate-400 hover:text-white transition-colors"
          title="Refresh Logs">
          <svg class="w-5 h-5" :class="{ 'animate-spin': isFetchingLogs }" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead class="bg-slate-900/50 text-slate-400 text-xs font-medium uppercase tracking-wider">
            <tr>
              <th class="px-6 py-3 border-b border-slate-700">Time</th>
              <th class="px-6 py-3 border-b border-slate-700">Event</th>
              <th class="px-6 py-3 border-b border-slate-700">Repository</th>
              <th class="px-6 py-3 border-b border-slate-700">Status</th>
              <th class="px-6 py-3 border-b border-slate-700">Details</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-700/50">
            <tr v-for="log in webhookLogs" :key="log.id" class="hover:bg-slate-700/30 transition-colors text-sm">
              <td class="px-6 py-4 text-slate-300 font-mono whitespace-nowrap">
                {{ formatTime(log.timestamp) }}
              </td>
              <td class="px-6 py-4">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                  :class="log.eventType === 'push' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'">
                  {{ log.eventType }}
                </span>
              </td>
              <td class="px-6 py-4 text-slate-300">
                {{ log.repository }}
              </td>
              <td class="px-6 py-4">
                <span v-if="log.status === 'success'" class="text-emerald-400 flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd" />
                  </svg>
                  Success
                </span>
                <span v-else-if="log.status === 'error'" class="text-red-400 flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clip-rule="evenodd" />
                  </svg>
                  Error
                </span>
                <span v-else class="text-slate-400 flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clip-rule="evenodd" />
                  </svg>
                  {{ log.status }}
                </span>
              </td>
              <td class="px-6 py-4 text-slate-500 text-xs truncate max-w-xs" :title="log.details">
                {{ log.details }}
              </td>
            </tr>
            <tr v-if="webhookLogs.length === 0">
              <td colspan="5" class="px-6 py-12 text-center text-slate-500 italic">
                No webhook events recorded yet. Perform a Push or click "Test" on GitHub.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { io } from 'socket.io-client'

const settings = ref({
  webhookSecret: '',
  discordWebhook: '',
  telegramBotToken: '',
  telegramChatId: ''
})
const githubAccounts = ref([])
const isSaving = ref(false)
const isConnecting = ref(false)
const isFetchingLogs = ref(false)
const newToken = ref('')
const showSecret = ref(false)
const copiedField = ref('')
const webhookLogs = ref([])
const versionInfo = ref({ current: null, latest: null, hasUpdate: false, releaseUrl: null, changelog: '' })
const checkingUpdate = ref(false)
const hasCheckedUpdate = ref(false)
const updating = ref(false)
const updateOutput = ref('')
let socket = null

const formatTime = (isoString) => {
  if (!isoString) return '-'
  const d = new Date(isoString)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

const webhookUrl = computed(() => {
  return window.location.origin + '/api/webhook'
})

const generateSecret = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  settings.value.webhookSecret = result
  showSecret.value = true
}

const copyToClipboard = async (text, field) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copiedField.value = field
    setTimeout(() => {
      if (copiedField.value === field) copiedField.value = ''
    }, 2000)
  } catch (err) {
    console.error('Failed to copy text: ', err)
  }
}

const fetchAccounts = async () => {
  try {
    const res = await fetch('/api/git/accounts', {
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
    const res = await fetch('/api/git/accounts', {
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
  if (!confirm('Are you sure you want to disconnect this account?')) return;
  try {
    await fetch(`/api/git/accounts/${id}`, {
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
    const res = await fetch('/api/settings', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('pm2me_token')}` }
    })
    const data = await res.json()
    settings.value = { ...settings.value, ...data }
  } catch (e) { console.error('Failed to load settings', e) }
}

const saveSettings = async () => {
  isSaving.value = true
  try {
    await fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('pm2me_token')}`
      },
      body: JSON.stringify(settings.value)
    })
    alert('Settings Saved Successfully')
  } catch (e) {
    alert('Failed to save settings')
  } finally {
    isSaving.value = false
  }
}

const fetchWebhookLogs = async () => {
  isFetchingLogs.value = true
  try {
    const res = await fetch('/api/settings/webhook-logs', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('pm2me_token')}` }
    })
    webhookLogs.value = await res.json()
  } catch (e) {
    console.error('Failed to load webhook logs')
  } finally {
    isFetchingLogs.value = false
  }
}

const setupSocket = () => {
  if (!socket) socket = io()
  socket.off('webhook-log') // Prevent duplicates
  socket.on('webhook-log', (log) => {
    webhookLogs.value.unshift(log)
    if (webhookLogs.value.length > 50) {
      webhookLogs.value = webhookLogs.value.slice(0, 50)
    }
  })
}

const checkUpdate = async () => {
  checkingUpdate.value = true
  try {
    const res = await fetch('/api/system/version-check', { headers: { 'Authorization': `Bearer ${localStorage.getItem('pm2me_token')}` } })
    versionInfo.value = await res.json()
    hasCheckedUpdate.value = true
  } finally { checkingUpdate.value = false }
}

const runUpdate = async () => {
  if (!confirm('Update PM2Me? The server will restart.')) return
  updating.value = true
  updateOutput.value = ''
  try {
    const res = await fetch('/api/system/update', { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('pm2me_token')}`, 'Content-Type': 'application/json' } })
    const data = await res.json()
    updateOutput.value = data.output || data.error || 'Done'
    if (data.success) await checkUpdate()
  } finally { updating.value = false }
}

onMounted(async () => {
  loadSettings()
  fetchAccounts()
  await fetchWebhookLogs()
  setupSocket()
  checkUpdate()
})

onUnmounted(() => {
  if (socket) socket.disconnect()
})
</script>
