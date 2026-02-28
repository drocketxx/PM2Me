<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-sm"
    v-if="isOpen">
    <div class="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 w-full max-w-2xl flex flex-col max-h-[90vh]">
      <div class="flex items-center justify-between p-6 border-b border-slate-700">
        <h3 class="text-xl font-bold text-white">{{ appToEdit ? 'Edit Application' : 'Deploy New Application' }}</h3>
        <button @click="$emit('close')" class="text-slate-400 hover:text-white transition-colors">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="overflow-y-auto p-6 flex-1 custom-scrollbar">
        <form @submit.prevent="submitDeploy" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-slate-300 mb-2">GitHub Repository</label>
              <div class="flex space-x-2">
                <select v-model="selectedRepo" required
                  class="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer">
                  <option value="" disabled>Select a repository...</option>
                  <optgroup v-for="group in repositoriesGrouped" :key="group.accountId" :label="'@' + group.account">
                    <option v-for="repo in group.repositories" :key="repo.id"
                      :value="{ url: repo.cloneUrl, token: group.token, name: repo.name }">
                      {{ repo.name }} {{ repo.private ? '🔒' : '' }}
                    </option>
                  </optgroup>
                </select>
                <button type="button" @click="fetchRepositories" :disabled="isFetchingRepos"
                  class="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors border border-slate-600 disabled:opacity-50"
                  title="Refresh Repositories">
                  <svg v-if="isFetchingRepos" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg"
                    fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                    </path>
                  </svg>
                  <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              <p v-if="repositoriesGrouped.length === 0" class="mt-2 text-xs text-yellow-500">No repositories found. Go
                to Settings to connect a GitHub Account.</p>
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-slate-300 mb-2">App Name</label>
              <input v-model="form.name" @input="userEditedName = true" required type="text"
                class="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-500"
                placeholder="my-awesome-app">
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Branch</label>
              <div class="flex space-x-2">
                <select v-model="form.branch" required
                  class="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer">
                  <option value="" disabled v-if="availableBranches.length === 0">Select a repository first...</option>
                  <option v-for="b in availableBranches" :key="b" :value="b">{{ b }}</option>
                </select>
                <button type="button" @click="fetchBranches" :disabled="isFetchingBranches || !selectedRepo"
                  class="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors border border-slate-600 disabled:opacity-50"
                  title="Refresh Branches">
                  <svg v-if="isFetchingBranches" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg"
                    fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                    </path>
                  </svg>
                  <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-slate-300 mb-2">Build Script (Optional)</label>
              <textarea v-model="form.buildScript" rows="2"
                class="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-500 custom-scrollbar"
                placeholder="npm install&#10;npm run build"></textarea>
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-slate-300 mb-2">PM2 Execution Mode</label>
              <div class="flex items-center space-x-6 mb-4">
                <label class="inline-flex items-center cursor-pointer">
                  <input type="radio" v-model="runType" value="npm"
                    class="form-radio text-blue-500 bg-slate-900 border-slate-600 focus:ring-blue-500/50">
                  <span class="ml-2 text-slate-300">Run NPM Script</span>
                </label>
                <label class="inline-flex items-center cursor-pointer">
                  <input type="radio" v-model="runType" value="ecosystem"
                    class="form-radio text-blue-500 bg-slate-900 border-slate-600 focus:ring-blue-500/50">
                  <span class="ml-2 text-slate-300">Ecosystem File</span>
                </label>
                <label class="inline-flex items-center cursor-pointer">
                  <input type="radio" v-model="runType" value="script"
                    class="form-radio text-blue-500 bg-slate-900 border-slate-600 focus:ring-blue-500/50">
                  <span class="ml-2 text-slate-300">Run Custom Script</span>
                </label>
              </div>

              <!-- Extra input for NPM Script -->
              <div v-if="runType === 'npm'" class="pl-2 border-l-2 border-slate-600">
                <label class="block text-xs font-medium text-slate-400 mb-1">NPM Script Name (e.g. start, dev,
                  prod)</label>
                <div class="flex items-center">
                  <span class="text-slate-500 mr-2 font-mono">npm run</span>
                  <input v-model="form.npmScript" type="text"
                    class="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-500 font-mono"
                    placeholder="start">
                </div>
              </div>

              <!-- Extra input for Custom Script -->
              <div v-if="runType === 'script'" class="pl-2 border-l-2 border-slate-600 mt-4">
                <label class="block text-xs font-medium text-slate-400 mb-1">Script Path (e.g. app.js,
                  dist/main.js)</label>
                <div class="flex items-center">
                  <input v-model="form.customScript" type="text"
                    class="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-500 font-mono"
                    placeholder="app.js">
                </div>
              </div>
            </div>

            <div class="md:col-span-2">
              <div class="flex items-center justify-between mb-2">
                <label class="block text-sm font-medium text-slate-300">Environment Variables</label>
                <div class="flex gap-2">
                  <button type="button" @click="triggerEnvImport"
                    class="text-xs px-2 py-1 bg-slate-700 text-slate-300 hover:bg-slate-600 rounded border border-slate-600 transition-colors flex items-center">
                    <svg class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Import .env
                  </button>
                  <input type="file" ref="envFileInput" @change="handleEnvImport" accept=".env, *.*" class="hidden">

                  <button type="button" @click="addEnvVar"
                    class="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded border border-blue-500/20 transition-colors flex items-center">
                    <svg class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Variable
                  </button>
                </div>
              </div>
              <div class="space-y-3">
                <div v-for="(env, index) in envVars" :key="index" class="flex items-center gap-2">
                  <input v-model="env.name" type="text" :class="[
                    'w-1/3 bg-slate-900 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:border-transparent outline-none transition-all placeholder-slate-500 font-mono',
                    duplicateEnvKeys.includes(env.name) && env.name.trim() !== '' ? 'border-yellow-500 text-yellow-400 focus:ring-yellow-500' : 'border-slate-600 text-white focus:ring-blue-500'
                  ]" placeholder="KEY"
                    :title="duplicateEnvKeys.includes(env.name) && env.name.trim() !== '' ? 'Duplicate key' : ''">
                  <span class="text-slate-500">=</span>
                  <input v-model="env.value" type="text"
                    class="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-500 font-mono"
                    placeholder="VALUE">
                  <button type="button" @click="removeEnvVar(index)"
                    class="p-1.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded transition-colors"
                    title="Remove">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <div v-if="duplicateEnvKeys.length > 0" class="text-xs text-yellow-500 flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Warning: Duplicate environment variable keys detected.
                </div>
                <div v-if="envVars.length === 0"
                  class="text-sm text-slate-500 italic py-1 px-2 border border-dashed border-slate-700 rounded text-center">
                  No environment variables defined.
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <div class="p-6 border-t border-slate-700 bg-slate-800/50 flex justify-between items-center rounded-b-2xl">
        <div>
          <button v-if="appToEdit" type="button" @click="confirmDelete"
            class="px-4 py-2.5 text-sm font-medium text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 rounded-lg transition-colors border border-red-500/20">
            Delete Application
          </button>
        </div>
        <div class="flex space-x-4">
          <button type="button" @click="$emit('close')"
            class="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors border border-slate-600">Cancel</button>
          <button @click="submitDeploy" :disabled="isSubmitting"
            class="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg transition-all shadow-lg shadow-blue-500/30 disabled:opacity-70 flex items-center">
            <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>
            {{ appToEdit ? 'Update App' : 'Deploy App' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'

const props = defineProps({
  isOpen: Boolean,
  appToEdit: Object
})
const emit = defineEmits(['close', 'deploy', 'delete'])

const form = ref({
  name: '',
  branch: 'main',
  buildScript: '',
  npmScript: 'start',
  customScript: 'app.js'
})
const selectedRepo = ref('')
const repositoriesGrouped = ref([])
const isFetchingRepos = ref(false)

const runType = ref('npm')
const envVars = ref([])
const isFetchingBranches = ref(false)
const availableBranches = ref([])
const isSubmitting = ref(false)
const userEditedName = ref(false)

const duplicateEnvKeys = computed(() => {
  const keys = envVars.value.map(env => env.name.trim()).filter(k => k !== '')
  return keys.filter((key, index) => keys.indexOf(key) !== index)
})

watch(() => props.isOpen, async (newVal) => {
  if (newVal) {
    if (repositoriesGrouped.value.length === 0) {
      await fetchRepositories()
    }

    if (props.appToEdit) {
      userEditedName.value = true;
      form.value.name = props.appToEdit.name;
      form.value.branch = props.appToEdit.branch;
      form.value.buildScript = props.appToEdit.buildScript || '';

      if (props.appToEdit.ecosystemFile) {
        runType.value = 'ecosystem';
      } else if (props.appToEdit.pm2Script && props.appToEdit.pm2Script !== 'npm') {
        runType.value = 'script';
        form.value.customScript = props.appToEdit.pm2Script;
      } else {
        runType.value = 'npm';
        form.value.npmScript = props.appToEdit.pm2Args ? props.appToEdit.pm2Args.replace('run ', '') : 'start';
      }

      const envKeys = Object.keys(props.appToEdit.env || {});
      envVars.value = envKeys.map(k => ({ name: k, value: props.appToEdit.env[k] }));

      let foundRepo = null;
      for (const group of repositoriesGrouped.value) {
        const match = group.repositories.find(r => r.cloneUrl === props.appToEdit.repoUrl);
        if (match) {
          foundRepo = { url: match.cloneUrl, token: group.token, name: match.name };
          break;
        }
      }
      if (foundRepo) {
        selectedRepo.value = foundRepo;
        await fetchBranches();
        form.value.branch = props.appToEdit.branch;
      }
    } else {
      userEditedName.value = false
      form.value = { name: '', branch: 'main', buildScript: '', npmScript: 'start', customScript: 'app.js' };
      selectedRepo.value = '';
      runType.value = 'npm';
      envVars.value = [];
      availableBranches.value = [];
    }
  }
})

watch(selectedRepo, (newRepo) => {
  if (newRepo && newRepo.name && !userEditedName.value) {
    form.value.name = newRepo.name
  }
  availableBranches.value = [] // Reset branches on repo change

  // Auto-fetch branches when repository is selected
  if (newRepo && newRepo.url) {
    fetchBranches()
  }
})

const fetchRepositories = async () => {
  isFetchingRepos.value = true
  try {
    const res = await fetch('http://localhost:12345/api/git/repositories', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('pm2me_token')}` }
    })
    repositoriesGrouped.value = await res.json()
  } catch (e) {
    console.error('Failed to load repositories')
  } finally {
    isFetchingRepos.value = false
  }
}

const addEnvVar = () => {
  envVars.value.push({ name: '', value: '' })
}

const removeEnvVar = (index) => {
  envVars.value.splice(index, 1)
}

const envFileInput = ref(null)

const triggerEnvImport = () => {
  if (envFileInput.value) {
    envFileInput.value.click()
  }
}

const handleEnvImport = (e) => {
  const file = e.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (event) => {
    const content = event.target.result
    const lines = content.split('\n')

    let importedCount = 0
    const newEnvVars = [...envVars.value]

    lines.forEach(line => {
      let cleanLine = line.trim()
      // Ignore empty lines and comments
      if (!cleanLine || cleanLine.startsWith('#')) return

      // Support 'export FOO=bar' format
      if (cleanLine.startsWith('export ')) {
        cleanLine = cleanLine.substring(7).trim()
      }

      const match = cleanLine.match(/^([^=]+)=(.*)$/)
      if (match) {
        let key = match[1].trim()
        let value = match[2].trim()

        // Remove surrounding quotes if they exist
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1)
        }

        // Check if key already exists to prevent duplicates (overwrite instead)
        const existingIndex = newEnvVars.findIndex(env => env.name === key)
        if (existingIndex >= 0) {
          newEnvVars[existingIndex].value = value
          importedCount++
        } else {
          // Look for an empty slot to fill first
          const emptySlotIndex = newEnvVars.findIndex(env => env.name.trim() === '' && env.value.trim() === '')
          if (emptySlotIndex >= 0) {
            newEnvVars[emptySlotIndex].name = key
            newEnvVars[emptySlotIndex].value = value
          } else {
            newEnvVars.push({ name: key, value: value })
          }
          importedCount++
        }
      }
    })

    envVars.value = newEnvVars

    if (importedCount === 0) {
      alert('No valid environment variables found in this file.')
    }

    // Reset file input so the same file can be selected again
    e.target.value = ''
  }
  reader.readAsText(file)
}

const fetchBranches = async () => {
  if (!selectedRepo.value || !selectedRepo.value.url) {
    alert('Please select a repository first')
    return
  }
  isFetchingBranches.value = true
  availableBranches.value = []
  try {
    const res = await fetch('http://localhost:12345/api/git/branches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('pm2me_token')}`
      },
      body: JSON.stringify({ repoUrl: selectedRepo.value.url, token: selectedRepo.value.token })
    })
    const branches = await res.json()
    if (branches.length > 0) {
      availableBranches.value = branches
      form.value.branch = branches.find(b => b === 'main' || b === 'master') || branches[0]
    } else {
      alert('No branches found or repo is private (needs token)')
    }
  } catch (e) {
    alert('Failed to fetch branches')
  } finally {
    isFetchingBranches.value = false
  }
}

const submitDeploy = async () => {
  let parsedEnv = {}
  envVars.value.forEach(env => {
    if (env.name.trim()) {
      parsedEnv[env.name.trim()] = env.value.trim()
    }
  })

  if (!selectedRepo.value || !selectedRepo.value.url) {
    alert('Please select a repository')
    return;
  }

  const deployData = {
    ...form.value,
    repoUrl: selectedRepo.value.url,
    token: selectedRepo.value.token,
    env: parsedEnv,
    pm2Script: runType.value === 'script' ? form.value.customScript : (runType.value === 'npm' ? 'npm' : null),
    pm2Args: runType.value === 'npm' ? `run ${form.value.npmScript || 'start'}` : null,
    ecosystemFile: runType.value === 'ecosystem' ? 'ecosystem.config.cjs' : null
  }

  isSubmitting.value = true
  try {
    const url = props.appToEdit ? `http://localhost:12345/api/apps/${props.appToEdit.id}` : 'http://localhost:12345/api/apps';
    const method = props.appToEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('pm2me_token')}`
      },
      body: JSON.stringify(deployData)
    });
    const data = await res.json()

    // trigger deploy
    fetch(`http://localhost:12345/api/deploy/${props.appToEdit ? props.appToEdit.id : data.id}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('pm2me_token')}` }
    });

    emit('deploy')
    emit('close')
  } catch (e) {
    alert('Failed to save app configuration')
  } finally {
    isSubmitting.value = false
  }
}

const confirmDelete = () => {
  if (confirm(`Are you sure you want to delete ${props.appToEdit.name}? This will stop the app and remove its configuration.`)) {
    emit('delete', props.appToEdit)
    emit('close')
  }
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #475569;
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}
</style>
