<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
    <!-- Server Monitor Section -->
    <ServerStats />

    <!-- PM2 Status Widget -->
    <div
      class="rounded-2xl border flex items-center justify-between px-6 py-4 shadow-xl backdrop-blur-sm transition-all"
      :class="!pm2Status.loaded || pm2Status.isChecking
        ? 'bg-slate-800/60 border-slate-700'
        : !pm2Status.installed
          ? 'bg-red-500/5 border-red-500/30'
          : pm2Status.hasUpdate
            ? 'bg-amber-500/5 border-amber-500/30'
            : 'bg-emerald-500/5 border-emerald-500/20'">
      <div class="flex items-center space-x-4">
        <!-- Icon -->
        <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          :class="!pm2Status.loaded || pm2Status.isChecking ? 'bg-slate-700' : !pm2Status.installed ? 'bg-red-500/20' : pm2Status.hasUpdate ? 'bg-amber-500/20' : 'bg-emerald-500/20'">
          <!-- Spinner while checking -->
          <svg v-if="!pm2Status.loaded || pm2Status.isChecking" class="animate-spin w-5 h-5 text-slate-400" fill="none"
            viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <svg v-else-if="!pm2Status.installed" class="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.75-2.96L13.75 4a2 2 0 00-3.5 0L3.25 16.04A2 2 0 005.07 19z" />
          </svg>
          <svg v-else-if="pm2Status.hasUpdate" class="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <svg v-else class="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd" />
          </svg>
        </div>
        <!-- Text -->
        <div>
          <p v-if="!pm2Status.loaded || pm2Status.isChecking" class="text-sm font-semibold text-slate-400">Checking PM2
            status...</p>
          <p v-else-if="!pm2Status.installed" class="text-sm font-semibold text-red-400">PM2 is not installed</p>
          <p v-else-if="pm2Status.hasUpdate" class="text-sm font-semibold text-amber-400">PM2 update available</p>
          <p v-else class="text-sm font-semibold text-emerald-400">PM2 is up to date</p>
          <p v-if="pm2Status.loaded && !pm2Status.isChecking && pm2Status.installed"
            class="text-xs text-slate-500 mt-0.5">
            Installed: <span class="text-slate-300 font-mono">v{{ pm2Status.version }}</span>
            <span v-if="pm2Status.hasUpdate"> → Latest: <span class="text-amber-300 font-mono">v{{
              pm2Status.latestVersion }}</span></span>
          </p>
          <p v-else-if="pm2Status.loaded && !pm2Status.isChecking && !pm2Status.installed"
            class="text-xs text-slate-500 mt-0.5">PM2 is required to run and manage applications</p>
        </div>
      </div>
      <!-- Actions -->
      <div class="flex items-center space-x-2 flex-shrink-0">
        <button v-if="pm2Status.loaded && !pm2Status.isChecking && pm2Status.isActing" disabled
          class="flex items-center px-4 py-2 rounded-xl text-sm font-medium bg-slate-700 text-slate-400 cursor-wait">
          <svg class="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          {{ pm2Status.installed ? 'Updating...' : 'Installing...' }}
        </button>
        <button v-else-if="pm2Status.loaded && !pm2Status.isChecking && !pm2Status.installed"
          @click="pm2InstallOrUpdate"
          class="flex items-center px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-500/20">
          <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Install PM2
        </button>
        <button v-else-if="pm2Status.loaded && !pm2Status.isChecking && pm2Status.hasUpdate" @click="pm2InstallOrUpdate"
          class="flex items-center px-4 py-2 rounded-xl text-sm font-medium bg-amber-500 hover:bg-amber-400 text-white transition-all shadow-lg shadow-amber-500/20">
          <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Update PM2
        </button>
        <button @click="fetchPm2Status" :disabled="pm2Status.isChecking"
          class="p-2 text-slate-400 hover:text-white transition-colors" title="Refresh">
          <svg class="w-4 h-4" :class="{ 'animate-spin': pm2Status.isChecking }" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>

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
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
      <div v-for="app in pm2Apps" :key="app.unique_key"
        class="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700 p-6 flex flex-col transition-all hover:border-slate-600 hover:shadow-2xl">
        <div class="flex items-start justify-between mb-4 gap-3">
          <div class="flex items-start space-x-3 min-w-0 flex-1">
            <div
              class="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center border border-slate-600 flex-shrink-0 mt-0.5">
              <svg class="h-6 w-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <h2 class="text-lg font-bold text-white truncate" :title="app.name">{{ app.name }}</h2>
              </div>
              <div class="flex items-center space-x-2 text-xs font-medium mt-1.5">
                <span class="relative flex h-2 w-2 flex-shrink-0">
                  <span v-if="app.pm2_env.status === 'online'"
                    class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2"
                    :class="getStatusColor(app.pm2_env.status)"></span>
                </span>
                <span :class="getStatusTextColor(app.pm2_env.status)" class="capitalize">{{ app.pm2_env.status }}</span>
                <span v-if="app.pm2_env.pm_uptime" class="text-slate-500 whitespace-nowrap">
                  {{ formatUptime(app.pm2_env.pm_uptime) }}
                </span>
              </div>
            </div>
          </div>
          <div class="flex items-center space-x-1.5 flex-shrink-0">
            <button v-if="app.id" @click="openEditModal(app, true)"
              class="p-2 text-slate-400 hover:text-blue-400 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600 focus:outline-none"
              title="Edit Config">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button @click="openLogs(app)"
              class="p-2 text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600 focus:outline-none"
              title="View Logs">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            <button @click="confirmDeleteApp(app)"
              class="p-2 text-slate-400 hover:text-red-400 bg-slate-700/50 hover:bg-red-500/10 rounded-lg transition-colors border border-slate-600 focus:outline-none"
              title="Delete Application">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <div v-if="app.status !== 'deploying'" class="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div class="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
            <p class="text-slate-500 mb-1 leading-none text-xs">CPU Usage</p>
            <p class="font-semibold text-slate-200">{{ app.monit ? app.monit.cpu : 0 }}%</p>
          </div>
          <div class="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
            <p class="text-slate-500 mb-1 leading-none text-xs">Memory</p>
            <p class="font-semibold text-slate-200">{{ formatBytes(app.monit ? app.monit.memory : 0) }}</p>
          </div>
          <div class="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
            <p class="text-slate-500 mb-1 leading-none text-xs">Restarts</p>
            <p class="font-semibold text-slate-200">{{ app.pm2_env.restart_time }}</p>
          </div>
          <div class="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
            <p class="text-slate-500 mb-1 leading-none text-xs">App Id</p>
            <p class="font-semibold text-slate-200">{{ app.pm_id }}</p>
          </div>
        </div>

        <!-- Latest Commit -->
        <div v-if="app.commitMessage && app.status !== 'deploying'"
          class="mb-4 text-[11px] bg-slate-900/50 border border-slate-700/50 p-2 rounded-lg text-slate-400 font-mono flex items-start"
          title="Latest Commit">
          <svg xmlns="http://www.w3.org/2000/svg" class="mr-2" width="14" height="14" viewBox="0 0 24 24"><!-- Icon from Sharp free icons by Streamline - https://creativecommons.org/licenses/by/4.0/ --><path fill="currentColor" fill-rule="evenodd" d="M15 2H9v6h2v3H3v5H1v6h6v-6H5v-3h6v3H9v6h6v-6h-2v-3h6v3h-2v6h6v-6h-2v-5h-8V8h2z" clip-rule="evenodd"/></svg>
          <span class="truncate">
            <span v-if="app.branch" class="text-blue-400 font-bold mr-1">{{ app.branch }}</span>
            <span v-if="app.branch" class="text-slate-600 mr-1">•</span>
            {{ app.commitMessage }}
          </span>
        </div>

        <!-- Failed Commit / Rollback Warning -->
        <div v-if="app.rollbackOccurred && app.failedCommitMessage"
          class="mb-4 text-[10px] bg-red-500/10 border border-red-500/20 p-2 rounded-lg text-red-400 font-mono flex flex-col gap-1 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
          <div class="flex items-center gap-1 font-bold uppercase tracking-wider text-[9px]">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 12 12" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Deployment Failed - Rolled Back
          </div>
          <div class="flex items-start">
            <svg class="w-3.5 h-3.5 mr-2 mt-0.5 flex-shrink-0 text-red-500/60" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <circle cx="12" cy="12" r="3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></circle>
              <line x1="3" y1="12" x2="9" y2="12" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
              </line>
              <line x1="15" y1="12" x2="21" y2="12" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
              </line>
            </svg>
            <span class="truncate opacity-80">{{ app.failedCommitMessage }}</span>
          </div>
          <p class="text-[9px] text-red-500/50 mt-1 italic">The system is currently running on the previous stable
            version.</p>
        </div>

        <!-- Node Deployment Pipeline State - Premium UI -->
        <transition enter-active-class="transition-all duration-500 ease-out"
          enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-500 ease-in" leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2">
          <div v-if="app.pipelineState && app.pipelineState !== 'hidden'"
            class="mt-4 pt-5 border-t border-slate-700/30 mb-6">
            <div class="flex items-center justify-between mb-4 px-1">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <svg class="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Deployment State
              </span>
              <div v-if="app.pipelineState" class="flex items-center gap-2">
                <span class="relative flex h-2 w-2"
                  v-if="app.pipelineState !== 'online' && app.pipelineState !== 'failed'">
                  <span
                    class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span
                  class="text-[10px] font-mono whitespace-nowrap px-2 py-0.5 rounded-full border uppercase tracking-wider backdrop-blur-sm"
                  :class="app.pipelineState === 'failed' ? 'text-red-400 bg-red-500/10 border-red-500/20' : (app.pipelineState === 'online' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-blue-400 bg-blue-500/10 border-blue-500/20')">
                  {{ (app.pipelineState && app.pipelineState.startsWith('failed:')) ? 'FAILED' : app.pipelineState }}
                </span>
              </div>
            </div>

            <div class="relative flex items-center justify-between px-4 pb-2">
              <!-- Background Track -->
              <div
                class="absolute left-6 right-6 h-1 bg-slate-800/80 rounded-full top-1/2 -translate-y-1/2 z-0 border border-slate-700/50 shadow-inner">
              </div>

              <!-- Glowing Progress Line -->
              <div
                class="absolute left-6 h-1 bg-gradient-to-r top-1/2 -translate-y-1/2 z-0 transition-all duration-700 ease-out"
                :class="app.pipelineState === 'failed' ? 'from-red-600 to-rose-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]' : (app.pipelineState === 'online' ? 'from-emerald-500 to-indigo-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'from-blue-600 to-indigo-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]')"
                :style="{ width: getPipelineProgressWidth(app.pipelineState) }"></div>

              <!-- Steps -->
              <div v-for="(step, index) in ['pulling', 'building', 'starting', 'online']" :key="step"
                class="relative z-10 flex flex-col items-center group">

                <!-- Connection Line -->
                <div v-if="index < 3"
                  class="absolute h-1 top-1/2 -translate-y-1/2 left-full w-full z-[-1] pointer-events-none transition-colors duration-500"
                  :class="isStepCompleted(step, app.pipelineState) ? ((app.pipelineState === 'failed' || (app.pipelineState && app.pipelineState.startsWith('failed:'))) ? 'bg-red-500/20' : (app.pipelineState === 'online' ? 'bg-emerald-500/20' : 'bg-indigo-500/20')) : 'bg-transparent'">
                </div>

                <div class="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 relative"
                  :class="getStepPremiumClass(step, app.pipelineState)">

                  <!-- Inner Glow for active step -->
                  <div v-if="app.pipelineState === step && app.pipelineState !== 'online'"
                    class="absolute inset-0 rounded-full animate-ping"
                    :class="app.pipelineState === 'failed' ? 'bg-red-400/20' : 'bg-blue-400/20'">
                  </div>

                  <svg v-if="isStepCompleted(step, app.pipelineState)"
                    class="w-4 h-4 text-white relative z-10 drop-shadow-md" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                  <svg v-else-if="app.pipelineState === 'failed' && isFailedStep(step, app.pipelineState)"
                    class="w-4 h-4 text-white relative z-10 drop-shadow-md" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>

                  <div v-else-if="app.pipelineState === step"
                    class="w-2.5 h-2.5 bg-white rounded-full relative z-10 shadow-[0_0_8px_rgba(255,255,255,0.8)]">
                  </div>

                  <div v-else
                    class="w-1.5 h-1.5 bg-slate-500 rounded-full relative z-10 opacity-50 group-hover:opacity-100 transition-opacity">
                  </div>
                </div>

                <span class="text-[9px] mt-2.5 font-bold uppercase tracking-wider transition-all duration-300"
                  :class="app.pipelineState === step ? (app.pipelineState === 'failed' ? 'text-red-300 drop-shadow-[0_0_2px_rgba(252,165,165,0.8)]' : (app.pipelineState === 'online' ? 'text-emerald-300 drop-shadow-[0_0_2px_rgba(110,231,183,0.8)]' : 'text-blue-300 drop-shadow-[0_0_2px_rgba(147,197,253,0.8)]')) : (isStepCompleted(step, app.pipelineState) ? 'text-slate-300' : 'text-slate-500')">
                  {{ getStepLabel(step) }}
                </span>
              </div>
            </div>
          </div>
        </transition>

        <div class="mt-auto grid grid-cols-3 gap-2">
          <button v-if="app.pm2_env.status === 'online'" @click="pm2Action('stop', app.name)"
            :disabled="loadingActions[`${app.name}-stop`]"
            class="flex items-center justify-center p-2 text-sm font-medium text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors border border-amber-500/20">
            <svg v-if="loadingActions[`${app.name}-stop`]" class="animate-spin h-4 w-4 mr-1.5" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none">
              </circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>
            <svg v-else class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                clip-rule="evenodd" />
            </svg>
            {{ loadingActions[`${app.name}-stop`] ? 'Stopping' : 'Stop' }}
          </button>

          <button v-else @click="pm2Action('start', app.name)" :disabled="loadingActions[`${app.name}-start`]"
            class="flex items-center justify-center p-2 text-sm font-medium text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors border border-emerald-500/20">
            <svg v-if="loadingActions[`${app.name}-start`]" class="animate-spin h-4 w-4 mr-1.5" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none">
              </circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>
            <svg v-else class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clip-rule="evenodd" />
            </svg>
            {{ loadingActions[`${app.name}-start`] ? 'Starting' : 'Start' }}
          </button>

          <button @click="pm2Action('restart', app.name)" :disabled="loadingActions[`${app.name}-restart`]"
            class="flex items-center justify-center p-2 text-sm font-medium text-blue-400 bg-blue-400/10 hover:bg-blue-400/20 rounded-lg transition-colors border border-blue-400/20">
            <svg v-if="loadingActions[`${app.name}-restart`]" class="animate-spin h-4 w-4 mr-1.5" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none">
              </circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>
            <svg v-else class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {{ loadingActions[`${app.name}-restart`] ? '...' : 'Restart' }}
          </button>

          <button v-if="app.id" @click="retryDeployForPm2App(app)" :disabled="loadingActions[`${app.name}-deploy`]"
            class="flex items-center justify-center p-2 text-sm font-medium text-purple-400 bg-purple-400/10 hover:bg-purple-400/20 rounded-lg transition-colors border border-purple-400/20 text-nowrap">
            <svg v-if="loadingActions[`${app.name}-deploy`]" class="animate-spin h-4 w-4 mr-1.5" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none">
              </circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>
            <svg v-else class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {{ loadingActions[`${app.name}-deploy`] ? 'Syncing' : 'Sync' }}
            <span v-if="!loadingActions[`${app.name}-deploy`] && syncStatuses[app.id]"
              class="ml-1 px-1.5 py-0.5 text-[10px] bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30 font-bold">
              {{ syncStatuses[app.id] }}
            </span>
          </button>
        </div>
      </div>
      <!-- Database Apps (Deploying/Failed) -->
      <div v-for="dbApp in deployingApps" :key="dbApp.id"
        class="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700/50 p-6 flex flex-col relative overflow-hidden">
        <div v-if="dbApp.status === 'deploying'"
          class="absolute inset-0 bg-blue-500/5 animate-pulse rounded-2xl blur-xl -z-10"></div>

        <div class="flex items-start justify-between mb-4 gap-3">
          <div class="flex items-start space-x-3 min-w-0 flex-1">
            <div
              class="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center border border-slate-600 flex-shrink-0 mt-0.5"
              :class="dbApp.status === 'deploying' ? 'text-blue-500' : 'text-red-500'">
              <svg v-if="dbApp.status === 'deploying'" class="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg"
                fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              <svg v-else class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="min-w-0 flex-1">
              <h2 class="text-lg font-bold text-white truncate" :title="dbApp.name">{{ dbApp.name }}</h2>
              <div class="flex items-center space-x-2 text-xs font-medium mt-1.5 flex-wrap">
                <span class="capitalize flex-shrink-0"
                  :class="dbApp.status === 'deploying' ? 'text-blue-400' : 'text-red-400'">
                  {{ dbApp.status }}
                </span>
                <span v-if="dbApp.commitMessage"
                  class="text-[10px] bg-slate-700/50 border border-slate-600 px-1.5 py-0.5 rounded text-slate-300 font-mono inline-block max-w-full truncate align-bottom mt-1 sm:mt-0"
                  title="Deployed Commit">
                  <svg class="w-3 h-3 inline pb-[1px] mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="12" cy="12" r="3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
                    </circle>
                    <line x1="3" y1="12" x2="9" y2="12" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
                    </line>
                    <line x1="15" y1="12" x2="21" y2="12" stroke-linecap="round" stroke-linejoin="round"
                      stroke-width="2">
                    </line>
                  </svg>{{ dbApp.commitMessage }}
                </span>
              </div>
            </div>
          </div>
          <div class="flex items-center space-x-1.5 flex-shrink-0">
            <button @click="openEditModal(dbApp, false)"
              class="p-2 text-slate-400 hover:text-blue-400 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600 focus:outline-none"
              title="Edit Config">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button @click="openDbAppLogs(dbApp)"
              class="p-2 text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600 focus:outline-none"
              title="View Logs">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Node Deployment Pipeline State - Premium UI -->
        <transition enter-active-class="transition-all duration-500 ease-out"
          enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-500 ease-in" leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2">
          <div v-if="dbApp.pipelineState && dbApp.pipelineState !== 'hidden'"
            class="mt-4 pt-5 border-t border-slate-700/30 mb-6">
            <div class="flex items-center justify-between mb-4 px-1">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <svg class="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Deployment State
              </span>
              <div class="flex items-center gap-2">
                <span class="relative flex h-2 w-2"
                  v-if="dbApp.pipelineState !== 'online' && dbApp.pipelineState !== 'failed'">
                  <span
                    class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span
                  class="text-[10px] font-mono whitespace-nowrap px-2 py-0.5 rounded-full border uppercase tracking-wider backdrop-blur-sm"
                  :class="(dbApp.pipelineState === 'failed' || (dbApp.pipelineState && dbApp.pipelineState.startsWith('failed:'))) ? 'text-red-400 bg-red-500/10 border-red-500/20' : (dbApp.pipelineState === 'online' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-blue-400 bg-blue-500/10 border-blue-500/20')">
                  {{ (dbApp.pipelineState && dbApp.pipelineState.startsWith('failed:')) ? 'FAILED' : dbApp.pipelineState
                  }}
                </span>
              </div>
            </div>

            <div class="relative flex items-center justify-between px-4 pb-2">
              <div
                class="absolute left-6 right-6 h-1 bg-slate-800/80 rounded-full top-1/2 -translate-y-1/2 z-0 border border-slate-700/50 shadow-inner">
              </div>

              <div
                class="absolute left-6 h-1 bg-gradient-to-r top-1/2 -translate-y-1/2 z-0 transition-all duration-700 ease-out"
                :class="dbApp.pipelineState === 'failed' ? 'from-red-600 to-rose-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]' : (dbApp.pipelineState === 'online' ? 'from-emerald-500 to-indigo-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'from-blue-600 to-indigo-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]')"
                :style="{ width: getPipelineProgressWidth(dbApp.pipelineState) }"></div>

              <div v-for="(step, index) in ['pulling', 'building', 'starting', 'online']" :key="step"
                class="relative z-10 flex flex-col items-center group">
                <div v-if="index < 3"
                  class="absolute h-1 top-1/2 -translate-y-1/2 left-full w-full z-[-1] pointer-events-none transition-colors duration-500"
                  :class="isStepCompleted(step, dbApp.pipelineState) ? ((dbApp.pipelineState === 'failed' || (dbApp.pipelineState && dbApp.pipelineState.startsWith('failed:'))) ? 'bg-red-500/20' : (dbApp.pipelineState === 'online' ? 'bg-emerald-500/20' : 'bg-indigo-500/20')) : 'bg-transparent'">
                </div>

                <div class="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 relative"
                  :class="getStepPremiumClass(step, dbApp.pipelineState)">
                  <div v-if="dbApp.pipelineState === step && dbApp.pipelineState !== 'online'"
                    class="absolute inset-0 rounded-full animate-ping"
                    :class="dbApp.pipelineState === 'failed' ? 'bg-red-400/20' : 'bg-blue-400/20'"></div>

                  <svg v-if="isStepCompleted(step, dbApp.pipelineState)"
                    class="w-4 h-4 text-white relative z-10 drop-shadow-md" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                  <svg v-else-if="dbApp.pipelineState === 'failed' && isFailedStep(step, dbApp.pipelineState)"
                    class="w-4 h-4 text-white relative z-10 drop-shadow-md" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <div v-else-if="dbApp.pipelineState === step"
                    class="w-2.5 h-2.5 bg-white rounded-full relative z-10 shadow-[0_0_8px_rgba(255,255,255,0.8)]">
                  </div>
                  <div v-else
                    class="w-1.5 h-1.5 bg-slate-500 rounded-full relative z-10 opacity-50 group-hover:opacity-100 transition-opacity">
                  </div>
                </div>

                <span class="text-[9px] mt-2.5 font-bold uppercase tracking-wider transition-all duration-300"
                  :class="dbApp.pipelineState === step ? (dbApp.pipelineState === 'failed' ? 'text-red-300 drop-shadow-[0_0_2px_rgba(252,165,165,0.8)]' : (dbApp.pipelineState === 'online' ? 'text-emerald-300 drop-shadow-[0_0_2px_rgba(110,231,183,0.8)]' : 'text-blue-300 drop-shadow-[0_0_2px_rgba(147,197,253,0.8)]')) : (isStepCompleted(step, dbApp.pipelineState) ? 'text-slate-300' : 'text-slate-500')">
                  {{ getStepLabel(step) }}
                </span>
              </div>
            </div>
          </div>
        </transition>

        <button v-if="dbApp.status !== 'deploying'" @click="retryDeploy(dbApp.id)"
          :disabled="loadingActions[`${dbApp.name}-deploy`]"
          class="flex items-center justify-center p-2 mt-auto text-sm font-medium text-purple-400 bg-purple-400/10 hover:bg-purple-400/20 rounded-lg transition-colors border border-purple-400/20 w-full">
          <svg v-if="loadingActions[`${dbApp.name}-deploy`]" class="animate-spin h-4 w-4 mr-1.5" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none">
            </circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
          <svg v-else class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {{ loadingActions[`${dbApp.name}-deploy`] ? 'Syncing...' : 'Deploy' }}
          <span v-if="!loadingActions[`${dbApp.name}-deploy`] && syncStatuses[dbApp.id]"
            class="ml-2 px-1.5 py-0.5 text-[10px] bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30 font-bold">
            {{ syncStatuses[dbApp.id] }}
          </span>
        </button>
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

    <!-- Custom Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
      <div
        class="bg-slate-800 border border-slate-700 rounded-3xl shadow-2xl max-w-md w-full p-8 text-center transform transition-all scale-100">
        <div
          class="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
          <svg class="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 class="text-2xl font-bold text-white mb-2">Delete Application?</h3>
        <p class="text-slate-400 mb-8 leading-relaxed">
          Are you sure you want to delete <span class="text-white font-semibold">{{ appPendingDeletion?.name }}</span>?
          This will stop the PM2 process and permanently remove the configuration.
        </p>
        <div class="flex flex-col sm:flex-row gap-3">
          <button @click="showDeleteConfirm = false; appPendingDeletion = null"
            class="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-all border border-slate-600">
            Keep Application
          </button>
          <button @click="executeAppDelete"
            class="flex-1 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-600/20">
            Yes, Delete it
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { io } from 'socket.io-client'
import DeployModal from '../components/DeployModal.vue'
import LogViewer from '../components/LogViewer.vue'
import ServerStats from '../components/ServerStats.vue'

const pm2Apps = ref([])
const dbApps = ref([])
const showDeployModal = ref(false)
const showLogViewer = ref(false)
const currentLogAppId = ref('')
const currentLogAppName = ref('')
const currentAppToEdit = ref(null)
const loadingActions = ref({}) // Tracks loading state per app and action (e.g. { 'app1-restart': true })
const syncStatuses = ref({})
const pipelineStates = ref({}) // appId -> state
const pipelineTimeouts = ref({}) // appId -> timeout instance
const activeMenuId = ref(null)
const showDeleteConfirm = ref(false)
const appPendingDeletion = ref(null)

const pm2Status = ref({ loaded: false, installed: false, version: null, latestVersion: null, hasUpdate: false, isChecking: false, isActing: false })

const fetchPm2Status = async () => {
  pm2Status.value.isChecking = true
  try {
    const res = await fetch('/api/pm2/version-check', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('pm2me_token')}` }
    })
    const data = await res.json()
    pm2Status.value = { ...pm2Status.value, ...data, loaded: true, isChecking: false }
  } catch {
    pm2Status.value.isChecking = false
    pm2Status.value.loaded = true
  }
}

const pm2InstallOrUpdate = async () => {
  pm2Status.value.isActing = true
  try {
    await fetch('/api/pm2/install-update', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('pm2me_token')}` }
    })
    await fetchPm2Status()
  } catch {
    // ignore
  } finally {
    pm2Status.value.isActing = false
  }
}

const toggleMenu = (id) => {
  activeMenuId.value = activeMenuId.value === id ? null : id
}
let socket = null

let pollInterval

const deployingApps = computed(() => {
  const pm2AppDbIds = (pm2Apps.value || []).map(a => a?.id).filter(Boolean)
  return (dbApps.value || []).filter(a => a && !pm2AppDbIds.includes(a.id))
})

const fetchApps = async () => {
  try {
    const token = localStorage.getItem('pm2me_token')
    const headers = { 'Authorization': `Bearer ${token}` }

    const [pm2Res, dbRes] = await Promise.all([
      fetch('/api/pm2/list', { headers }),
      fetch('/api/apps', { headers })
    ])

    if (pm2Res.ok) pm2Apps.value = await pm2Res.json()
    if (dbRes.ok) {
      const fetchedDbApps = await dbRes.json()
      dbApps.value = fetchedDbApps.map(app => {
        let state = app.pipelineState;
        if (state === 'online') state = 'hidden';
        app.pipelineState = pipelineStates.value[app.id] || state || 'hidden';
        return app;
      });
    }

    // Inject commit hash into pm2Apps for display
    let enrichedPm2Apps = []
    const rawPm2Apps = pm2Apps.value

    rawPm2Apps.forEach(pm2App => {
      if (!pm2App) return;
      const matchingDbApps = dbApps.value.filter(db => db && db.name === pm2App.name)

      if (matchingDbApps.length > 0) {
        matchingDbApps.forEach(dbMatch => {
          const clone = JSON.parse(JSON.stringify(pm2App))
          clone.id = dbMatch.id;
          clone.commitHash = dbMatch.commitHash;
          clone.commitMessage = dbMatch.commitMessage;
          clone.branch = dbMatch.branch;
          clone.rollbackOccurred = dbMatch.rollbackOccurred;
          clone.failedCommitHash = dbMatch.failedCommitHash;
          clone.failedCommitMessage = dbMatch.failedCommitMessage;
          clone.pipelineState = pipelineStates.value[dbMatch.id] || dbMatch.pipelineState || 'hidden';
          clone.unique_key = `pm2_${clone.pm_id}_db_${dbMatch.id}`;
          enrichedPm2Apps.push(clone);
        })
      } else {
        const clone = JSON.parse(JSON.stringify(pm2App))
        clone.pipelineState = 'hidden';
        clone.unique_key = `pm2_${clone.pm_id}`;
        enrichedPm2Apps.push(clone);
      }
    })

    pm2Apps.value = enrichedPm2Apps.filter(Boolean)

    // Fetch sync status for all apps
    dbApps.value.forEach(app => {
      fetchSyncStatus(app.id)
    })
  } catch (e) {
    console.error('Fetch apps error:', e)
  }
}

const fetchSyncStatus = async (appId) => {
  try {
    const token = localStorage.getItem('pm2me_token')
    const res = await fetch(`/api/apps/${appId}/sync-status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (data.behindCount !== undefined) {
      syncStatuses.value[appId] = data.behindCount
    }
  } catch (err) {
    console.error('Failed to fetch sync status', err)
  }
}

const getDbAppId = (name) => {
  const app = dbApps.value.find(a => a.name === name)
  return app ? app.id : null
}

const pm2Action = async (action, name) => {
  const loadingKey = `${name}-${action}`;
  loadingActions.value[loadingKey] = true;
  try {
    await fetch(`/api/pm2/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('pm2me_token')}`
      },
      body: JSON.stringify({ nameOrId: name })
    })
    await fetchApps()
  } catch (e) {
    alert(`Failed to ${action} app`)
  } finally {
    loadingActions.value[loadingKey] = false;
  }
}

const removeDbApp = async (id) => {
  try {
    await fetch(`/api/apps/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('pm2me_token')}` }
    })
    await fetchApps()
  } catch (e) {
    console.error('Failed to remove db app', e);
  }
}

const handleAppDelete = async (appToDelete) => {
  if (!appToDelete) return;
  confirmDeleteApp(appToDelete);
}

const confirmDeleteApp = (app) => {
  appPendingDeletion.value = app;
  showDeleteConfirm.value = true;
}

const executeAppDelete = async () => {
  const appToDelete = appPendingDeletion.value;
  if (!appToDelete) return;

  showDeleteConfirm.value = false;
  appPendingDeletion.value = null;

  // Try to gracefully stop and delete from pm2 first if it exists
  try {
    await fetch(`/api/pm2/delete`, {
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

const retryDeploy = async (id, appName) => {
  const loadingKey = `${appName || id}-deploy`;
  loadingActions.value[loadingKey] = true;
  try {
    await fetch(`/api/deploy/${id}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('pm2me_token')}` }
    })
    // fetchApps immediately to show the "deploying" status
    await fetchApps()
  } catch (e) {
    alert('Failed to trigger deployment restart.')
  } finally {
    loadingActions.value[loadingKey] = false;
  }
}

const retryDeployForPm2App = (app) => {
  if (app.id) {
    retryDeploy(app.id, app.name);
  } else {
    // legacy fallback
    const dbApp = dbApps.value.find(db => db.name === app.name);
    if (dbApp) retryDeploy(dbApp.id, app.name);
    else alert('Cannot deploy this app as it was not deployed via PM2Me (No config found).');
  }
}

const openLogs = (app) => {
  currentLogAppName.value = app.name
  if (app.id) {
    currentLogAppId.value = app.id
  } else {
    const dbApp = dbApps.value.find(db => db.name === app.name)
    currentLogAppId.value = dbApp ? dbApp.id : app.name
  }
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
const formatUptime = (timestamp) => {
  if (!timestamp) return '0s'
  const diff = Date.now() - timestamp
  const seconds = Math.floor(diff / 1000)
  const days = Math.floor(seconds / (3600 * 24))
  const hours = Math.floor((seconds % (3600 * 24)) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m`
  return `${seconds}s`
}

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

// Pipeline Helpers
const pipelineOrder = ['pulling', 'building', 'starting', 'online']

const getStepLabel = (step) => {
  const labels = { 'pulling': 'Pull', 'building': 'Build', 'starting': 'Run', 'online': 'Online' }
  return labels[step] || step
}

const normalizeState = (state) => {
  if (state && typeof state === 'string' && state.startsWith('failed:')) return state.split(':')[1];
  return state;
}

const getPipelineProgressWidth = (currentState) => {
  const effectiveState = normalizeState(currentState)
  const index = pipelineOrder.indexOf(effectiveState)
  if (index === -1) return '0%'
  const percentage = (index / (pipelineOrder.length - 1)) * 100
  // Background track is left-6 right-6 (24px each side)
  // So the maximum width should be 100% - 48px
  return `calc(${percentage}% - ${(percentage / 100) * 48}px)`
}

const isStepCompleted = (step, currentState) => {
  if (currentState === 'online' && step === 'online') return true;
  const effectiveState = normalizeState(currentState)
  const stepIndex = pipelineOrder.indexOf(step)
  const currentIndex = pipelineOrder.indexOf(effectiveState)
  return stepIndex < currentIndex
}

const getStepPremiumClass = (step, currentState) => {
  if (isFailedStep(step, currentState)) {
    return 'bg-red-500 border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.6)] border-0 scale-110'
  }

  if (isStepCompleted(step, currentState)) {
    if (step === 'online' && currentState === 'online') {
      return 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-[0_0_15px_rgba(16,185,129,0.5)] border-0 scale-110'
    }
    return 'bg-gradient-to-br from-indigo-500 to-blue-600 shadow-[0_0_10px_rgba(99,102,241,0.4)] border-0'
  }

  if (normalizeState(currentState) === step) {
    return 'bg-slate-800 border-[1.5px] border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.5)] scale-110'
  }

  return 'bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm shadow-inner'
}

const isFailedStep = (step, currentState) => {
  if (currentState && typeof currentState === 'string' && currentState.startsWith('failed:')) {
    return step === currentState.split(':')[1];
  }
  return currentState === 'failed' && step === 'starting';
}

const getStepClass = (step, currentState) => {
  if (currentState === step) return 'border-blue-500 bg-blue-500 shadow-lg shadow-blue-500/50'
  if (isStepCompleted(step, currentState)) return 'border-emerald-500 bg-emerald-500'
  return 'border-slate-700 bg-slate-800'
}

const setupSocket = () => {
  if (!socket) socket = io()
  dbApps.value.forEach(app => {
    socket.off(`pipeline-state-${app.id}`) // Prevent duplicates
    socket.on(`pipeline-state-${app.id}`, (state) => {
      // Clear existing timeout if any
      if (pipelineTimeouts.value[app.id]) {
        clearTimeout(pipelineTimeouts.value[app.id]);
        delete pipelineTimeouts.value[app.id];
      }

      pipelineStates.value[app.id] = state

      const applyState = (resolvedState) => {
        const pm2App = pm2Apps.value.find(a => a.name === app.name)
        if (pm2App) pm2App.pipelineState = resolvedState

        const deployingApp = dbApps.value.find(a => a.id === app.id)
        if (deployingApp) deployingApp.pipelineState = resolvedState
      }

      applyState(state)

      if (state === 'online') {
        fetchApps() // Refresh lists when online to capture new stats/commit immediately

        // Hide UI after 2 seconds
        pipelineTimeouts.value[app.id] = setTimeout(() => {
          pipelineStates.value[app.id] = 'hidden';
          applyState('hidden');
        }, 2000);
      }
    })
  })
}

onMounted(async () => {
  await fetchApps()
  setupSocket()
  pollInterval = setInterval(fetchApps, 12345)
  fetchPm2Status()
})

onUnmounted(() => {
  if (socket) socket.disconnect()
  clearInterval(pollInterval)
})

</script>
