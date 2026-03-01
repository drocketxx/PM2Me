<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
      <div>
        <h1 class="text-3xl font-bold text-white tracking-tight">Applications</h1>
        <p class="text-sm text-slate-400 mt-1">Manage and monitor your PM2 deployments</p>
      </div>
      <button @click="showDeployModal = true"
        class="flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-blue-500/30 transform hover:-translate-y-0.5">
        <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Deploy New App
      </button>
    </div>

    <!-- PM2 Apps List -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="app in pm2Apps" :key="app.pm_id"
        class="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700 p-6 flex flex-col transition-all hover:border-slate-600 hover:shadow-2xl">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center border border-slate-600">
              <svg class="h-6 w-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-bold text-white">{{ app.name }}</h2>
              <div class="flex items-center space-x-2 text-xs font-medium">
                <span class="relative flex h-2 w-2">
                  <span v-if="app.pm2_env.status === 'online'"
                    class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2"
                    :class="getStatusColor(app.pm2_env.status)"></span>
                </span>
                <span :class="getStatusTextColor(app.pm2_env.status)" class="capitalize">{{ app.pm2_env.status }}</span>
                <span v-if="app.commitMessage"
                  class="ml-2 text-[10px] bg-slate-700/50 border border-slate-600 px-1.5 py-0.5 rounded text-slate-300 font-mono inline-block max-w-[150px] truncate align-bottom"
                  title="Deployed Commit">
                  <svg class="w-3 h-3 inline pb-[1px] mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 17l4 4 4-4m-4-5v9" />
                  </svg>{{ app.commitMessage }}
                </span>
              </div>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <button @click="openEditModal(app, true)"
              class="p-2 text-slate-400 hover:text-blue-400 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600 focus:outline-none"
              title="Edit Config">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button @click="openLogs(app)"
              class="p-2 text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600 focus:outline-none"
              title="View Logs">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div class="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
            <p class="text-slate-500 mb-1">CPU Usage</p>
            <p class="font-semibold text-slate-200">{{ app.monit ? app.monit.cpu : 0 }}%</p>
          </div>
          <div class="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
            <p class="text-slate-500 mb-1">Memory</p>
            <p class="font-semibold text-slate-200">{{ formatBytes(app.monit ? app.monit.memory : 0) }}</p>
          </div>
          <div class="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
            <p class="text-slate-500 mb-1">Restarts</p>
            <p class="font-semibold text-slate-200">{{ app.pm2_env.restart_time }}</p>
          </div>
          <div class="bg-slate-900/50 rounded-lg p-3 border border-slate-700 flex flex-col justify-center text-center">
            <p class="text-slate-400 text-xs">ID: {{ app.pm_id }}</p>
          </div>
        </div>

        <div class="mt-auto grid grid-cols-3 gap-2">
          <button v-if="app.pm2_env.status === 'online'" @click="pm2Action('stop', app.name)"
            class="flex items-center justify-center p-2 text-sm font-medium text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors border border-amber-500/20">
            <svg class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                clip-rule="evenodd" />
            </svg>Stop
          </button>
          <button v-else @click="pm2Action('start', app.name)"
            class="flex items-center justify-center p-2 text-sm font-medium text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors border border-emerald-500/20">
            <svg class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clip-rule="evenodd" />
            </svg>Start
          </button>

          <button @click="pm2Action('restart', app.name)"
            class="flex items-center justify-center p-2 text-sm font-medium text-blue-400 bg-blue-400/10 hover:bg-blue-400/20 rounded-lg transition-colors border border-blue-400/20">
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>Restart
          </button>

          <button @click="retryDeployForPm2App(app)"
            class="flex items-center justify-center p-2 text-sm font-medium text-purple-400 bg-purple-400/10 hover:bg-purple-400/20 rounded-lg transition-colors border border-purple-400/20 text-nowrap">
            <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>Deploy
          </button>
        </div>
      </div>

      <!-- Database Apps (Deploying/Failed) -->
      <div v-for="dbApp in deployingApps" :key="dbApp.id"
        class="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700/50 p-6 flex flex-col relative overflow-hidden">
        <div v-if="dbApp.status === 'deploying'"
          class="absolute inset-0 bg-blue-500/5 animate-pulse rounded-2xl blur-xl -z-10"></div>
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center border border-slate-600">
              <svg v-if="dbApp.status === 'deploying'" class="animate-spin h-6 w-6 text-blue-400"
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              <svg v-else class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-bold text-white">{{ dbApp.name }}</h2>
              <div class="flex items-center space-x-2 text-xs font-medium">
                <span class="capitalize" :class="dbApp.status === 'deploying' ? 'text-blue-400' : 'text-red-400'">{{
                  dbApp.status }}</span>
                <span v-if="dbApp.commitMessage"
                  class="ml-2 text-[10px] bg-slate-700/50 border border-slate-600 px-1.5 py-0.5 rounded text-slate-300 font-mono inline-block max-w-[150px] truncate align-bottom"
                  title="Deployed Commit">
                  <svg class="w-3 h-3 inline pb-[1px] mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 17l4 4 4-4m-4-5v9" />
                  </svg>{{ dbApp.commitMessage }}
                </span>
              </div>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <button @click="openEditModal(dbApp, false)"
              class="p-2 text-slate-400 hover:text-blue-400 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600 focus:outline-none"
              title="Edit Config">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button @click="openDbAppLogs(dbApp)"
              class="p-2 text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600 focus:outline-none"
              title="View Logs">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          </div>
        </div>
        <button v-if="dbApp.status !== 'deploying'" @click="retryDeploy(dbApp.id)"
          class="flex items-center justify-center p-2 text-sm font-medium text-purple-400 bg-purple-400/10 hover:bg-purple-400/20 rounded-lg transition-colors border border-purple-400/20 col-span-2">
          <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>Deploy
        </button>
      </div>
    </div>

  </div>

  <!-- Empty State -->
  <div v-if="pm2Apps.length === 0 && deployingApps.length === 0"
    class="flex flex-col items-center justify-center p-12 bg-slate-800/30 rounded-3xl border border-slate-700/50 border-dashed">
    <div
      class="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6 shadow-inner ring-1 ring-slate-700/50">
      <svg class="h-10 w-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    </div>
    <h3 class="text-xl font-bold text-white mb-2">No Applications Found</h3>
    <p class="text-slate-400 text-center max-w-sm mb-6">You haven't deployed any applications yet or PM2 is not
      managing any processes.</p>
    <button @click="showDeployModal = true"
      class="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-all shadow-lg border border-slate-600">
      Deploy Your First App
    </button>
  </div>

  <DeployModal :isOpen="showDeployModal" :appToEdit="currentAppToEdit"
    @close="showDeployModal = false; currentAppToEdit = null" @deploy="fetchApps" @delete="handleAppDelete" />
  <LogViewer :isOpen="showLogViewer" :appId="currentLogAppId" :appName="currentLogAppName"
    @close="showLogViewer = false" />
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import DeployModal from '../components/DeployModal.vue'
import LogViewer from '../components/LogViewer.vue'

const pm2Apps = ref([])
const dbApps = ref([])
const showDeployModal = ref(false)
const showLogViewer = ref(false)
const currentLogAppId = ref('')
const currentLogAppName = ref('')
const currentAppToEdit = ref(null)

let pollInterval

const deployingApps = computed(() => {
  const pm2Names = pm2Apps.value.map(a => a.name)
  return dbApps.value.filter(a => !pm2Names.includes(a.name))
})

const fetchApps = async () => {
  try {
    const token = localStorage.getItem('pm2me_token')
    const headers = { 'Authorization': `Bearer ${token}` }

    const [pm2Res, dbRes] = await Promise.all([
      fetch('http://localhost:12345/api/pm2/list', { headers }),
      fetch('http://localhost:12345/api/apps', { headers })
    ])

    if (pm2Res.ok) pm2Apps.value = await pm2Res.json()
    if (dbRes.ok) dbApps.value = await dbRes.json()

    // Inject commit hash into pm2Apps for display
    pm2Apps.value = pm2Apps.value.map(pm2App => {
      const dbMatch = dbApps.value.find(db => db.name === pm2App.name)
      if (dbMatch) {
        pm2App.commitHash = dbMatch.commitHash;
        pm2App.commitMessage = dbMatch.commitMessage;
      }
      return pm2App
    })
  } catch (e) {
    console.error('Fetch apps error:', e)
  }
}

const pm2Action = async (action, name) => {
  try {
    await fetch(`http://localhost:12345/api/pm2/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('pm2me_token')}`
      },
      body: JSON.stringify({ nameOrId: name })
    })
    fetchApps()
  } catch (e) {
    alert(`Failed to ${action} app`)
  }
}

const removeDbApp = async (id) => {
  try {
    await fetch(`http://localhost:12345/api/apps/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('pm2me_token')}` }
    })
    fetchApps()
  } catch (e) {
    console.error('Failed to remove db app', e);
  }
}

const handleAppDelete = async (appToDelete) => {
  if (!appToDelete) return;
  // Try to gracefully stop and delete from pm2 first if it exists
  try {
    await fetch(`http://localhost:12345/api/pm2/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('pm2me_token')}`
      },
      body: JSON.stringify({ nameOrId: appToDelete.name })
    });
  } catch (e) {
    console.error("Failed to delete PM2 process, proceeding to DB removal")
  }
  await removeDbApp(appToDelete.id);
}

const retryDeploy = async (id) => {
  try {
    fetch(`http://localhost:12345/api/deploy/${id}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('pm2me_token')}` }
    })
    // fetchApps immediately to show the "deploying" status
    fetchApps()
  } catch (e) {
    alert('Failed to trigger deployment restart.')
  }
}

const retryDeployForPm2App = (app) => {
  const dbApp = dbApps.value.find(db => db.name === app.name);
  if (!dbApp) {
    alert('Cannot deploy this app as it was not deployed via PM2Me (No config found).');
    return;
  }
  retryDeploy(dbApp.id);
}

const openLogs = (app) => {
  currentLogAppName.value = app.name
  // If it's a pm2 app, it doesn't have the db appId attached easily. 
  // So we'll find matching dbApp by name. If not, use PM2 name as ID (backend needs to support this or stream logic depends on appId)
  // For now, let's just make sure PM2 apps match their DB counterpart.
  const dbApp = dbApps.value.find(db => db.name === app.name)
  currentLogAppId.value = dbApp ? dbApp.id : app.name
  showLogViewer.value = true
}

const openDbAppLogs = (dbApp) => {
  currentLogAppName.value = dbApp.name
  currentLogAppId.value = dbApp.id
  showLogViewer.value = true
}

const openEditModal = (appOrDbApp, isPm2 = false) => {
  let dbApp = appOrDbApp;
  if (isPm2) {
    dbApp = dbApps.value.find(db => db.name === appOrDbApp.name);
    if (!dbApp) {
      alert('Cannot edit this app as it was not deployed via PM2Me (No config found).');
      return;
    }
  }
  currentAppToEdit.value = dbApp;
  showDeployModal.value = true;
}

// Helpers
const formatBytes = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getStatusColor = (status) => {
  if (status === 'online') return 'bg-emerald-500'
  if (status === 'stopping' || status === 'stopped') return 'bg-amber-500'
  if (status === 'errored') return 'bg-red-500'
  return 'bg-slate-500'
}

const getStatusTextColor = (status) => {
  if (status === 'online') return 'text-emerald-400'
  if (status === 'stopping' || status === 'stopped') return 'text-amber-400'
  if (status === 'errored') return 'text-red-400'
  return 'text-slate-400'
}

onMounted(() => {
  fetchApps()
  pollInterval = setInterval(fetchApps, 12345)
})

onUnmounted(() => {
  clearInterval(pollInterval)
})

</script>
