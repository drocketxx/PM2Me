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
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium"
          :class="status.running ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'">
          <span class="relative flex h-2 w-2">
            <span v-if="status.running" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2" :class="status.running ? 'bg-emerald-400' : 'bg-slate-500'"></span>
          </span>
          {{ status.running ? 'Running' : 'Stopped' }}
        </div>
        <button @click="refreshStatus" :disabled="status.checking" class="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800">
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
        <p class="text-xs text-slate-500 mb-1">Config Dir</p>
        <p class="text-xs font-mono text-slate-300 break-all">{{ info.confDir }}</p>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="bg-slate-800/60 rounded-2xl border border-slate-700 p-5">
      <h2 class="text-sm font-semibold text-slate-300 mb-4">Process Control</h2>
      <div class="flex flex-wrap gap-3">
        <button @click="runAction('test')" :disabled="actionLoading" class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-400 disabled:opacity-50">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Test Config
        </button>
        <button @click="runAction('start')" :disabled="actionLoading || status.running" class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-400 disabled:opacity-30">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Start
        </button>
        <button @click="runAction('reload')" :disabled="actionLoading || !status.running" class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/30 text-amber-400 disabled:opacity-30">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          Reload
        </button>
        <button @click="runAction('quit')" :disabled="actionLoading || !status.running" class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-300 disabled:opacity-30">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/></svg>
          Quit
        </button>
        <button @click="runAction('stop')" :disabled="actionLoading || !status.running" class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-400 disabled:opacity-30">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          Stop
        </button>
        <div v-if="actionLoading" class="flex items-center gap-2 text-slate-400 text-sm">
          <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
          Running...
        </div>
      </div>
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

    <!-- Config Editor with file list sidebar -->
    <div class="bg-slate-800/60 rounded-2xl border border-slate-700 overflow-hidden">
      <div class="flex" style="min-height: 600px;">

        <!-- ── File Sidebar ─────────────────────────────── -->
        <div class="flex-shrink-0 bg-slate-900/60 border-r border-slate-700" style="width: 220px;">
          <!-- sidebar header -->
          <div class="flex items-center justify-between px-3 py-2 border-b border-slate-700/50">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Files</span>
            <button @click="showNewFileInput = true" title="New file"
              class="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-white transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            </button>
          </div>

          <!-- new file input -->
          <div v-if="showNewFileInput" class="px-2 py-2 border-b border-slate-700/50">
            <input v-model="newFileName" @keydown.enter="createNewFile" @keydown.escape="showNewFileInput = false; newFileName = ''"
              placeholder="filename.conf"
              class="w-full bg-slate-800 border border-blue-500/50 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-400"
              autofocus />
            <div class="flex gap-1 mt-1">
              <button @click="createNewFile" class="flex-1 text-xs px-2 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-400 rounded">Create</button>
              <button @click="showNewFileInput = false; newFileName = ''" class="flex-1 text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded">Cancel</button>
            </div>
          </div>

          <!-- file list -->
          <div class="overflow-y-auto" style="max-height: 560px;">
            <div v-if="files.length === 0" class="px-3 py-4 text-xs text-slate-600 text-center">No config files found</div>
            <div v-for="f in files" :key="f.path"
              @click="selectFile(f)"
              class="group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors border-l-2"
              :class="activeFile?.path === f.path
                ? 'bg-slate-700/60 border-blue-500 text-slate-100'
                : 'border-transparent hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'">

              <!-- file icon -->
              <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>

              <span class="flex-1 text-xs font-mono truncate">{{ f.name }}</span>

              <!-- enabled badge (Linux only) -->
              <span v-if="!isWindows && f.enabledPath"
                class="text-[10px] px-1 rounded font-medium flex-shrink-0"
                :class="f.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500'">
                {{ f.enabled ? 'on' : 'off' }}
              </span>

              <!-- delete button -->
              <button v-if="f.name !== 'nginx.conf'" @click.stop="deleteFile(f)"
                class="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all flex-shrink-0"
                title="Delete">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          <!-- Enable/Disable button (Linux, sites-available only) -->
          <div v-if="!isWindows && activeFile && activeFile.enabledPath" class="border-t border-slate-700/50 p-2">
            <button @click="toggleEnabled" :disabled="togglingEnabled"
              class="w-full text-xs px-3 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5"
              :class="activeFile.enabled
                ? 'bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400'
                : 'bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400'">
              <svg v-if="togglingEnabled" class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              <template v-else>
                {{ activeFile.enabled ? '⛔ Disable site' : '✅ Enable site' }}
              </template>
            </button>
            <p class="text-[10px] text-slate-600 text-center mt-1">
              {{ activeFile.enabled ? 'Will unlink from sites-enabled' : 'Will symlink to sites-enabled' }}
            </p>
          </div>
        </div>

        <!-- ── Editor Area ──────────────────────────────── -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- editor toolbar -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-900/30">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <span class="text-sm font-semibold text-slate-300">{{ activeFile?.name || 'No file selected' }}</span>
              <span class="text-xs text-slate-600 font-mono">{{ activeFile?.path }}</span>
              <span v-if="configDirty" class="text-xs text-amber-400 flex items-center gap-1">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4"/></svg>
                Unsaved
              </span>
            </div>
            <div class="flex items-center gap-2">
              <button @click="saveConfig" :disabled="savingConfig || !configDirty || !activeFile"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-40">
                <svg v-if="!savingConfig" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
                <svg v-else class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                Save
              </button>
              <button @click="reloadConfig" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 transition-all">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                Reload
              </button>
            </div>
          </div>

          <!-- No file selected -->
          <div v-if="!activeFile" class="flex-1 flex items-center justify-center text-slate-600 text-sm">
            Select a file from the sidebar to edit
          </div>

          <!-- Editor: gutter + code area -->
          <template v-else>
            <div class="flex overflow-hidden flex-1" style="background: #030712;">

              <!-- Line Numbers Gutter -->
              <div ref="gutterRef"
                class="select-none flex-shrink-0 text-right font-mono text-[13px] leading-relaxed border-r border-slate-800"
                style="min-width: 3.5rem; overflow: hidden; pointer-events: none; padding: 12px 10px 12px 8px; background: #020617;">
                <div v-for="n in lineCount" :key="n" class="transition-colors"
                  :class="n === cursorPos.line && editorFocused ? 'text-slate-300' : 'text-slate-600'">{{ n }}</div>
              </div>

              <!-- Scroll wrapper -->
              <div ref="scrollWrap" class="relative flex-1 editor-scroll"
                style="overflow-y: scroll; overflow-x: auto;" @scroll="syncGutter">
                <!-- Invisible spacer -->
                <div aria-hidden="true" class="invisible pointer-events-none whitespace-pre editor-line-height"
                  style="padding: 12px 16px;" v-text="configContent + '\n'"></div>
                <!-- Highlighted pre -->
                <pre ref="highlightPre" aria-hidden="true"
                  class="absolute top-0 left-0 w-full m-0 pointer-events-none editor-line-height whitespace-pre"
                  style="padding: 12px 16px;" v-html="highlighted"></pre>
                <!-- Textarea -->
                <textarea ref="editorRef" v-model="configContent"
                  @input="onInput" @click="updateCursor($event)"
                  @keydown="handleKeyDown" @keyup="updateCursor($event)"
                  @focus="editorFocused = true" @blur="editorFocused = false"
                  spellcheck="false"
                  class="absolute top-0 left-0 w-full focus:outline-none resize-none editor-textarea editor-line-height"
                  style="padding: 12px 16px; height: 100%; caret-color: #60a5fa; color: transparent; background: transparent; tab-size: 4; white-space: pre; overflow: hidden; z-index: 1;"
                  placeholder=""></textarea>
              </div>
            </div>

            <!-- Status bar -->
            <div class="flex items-center justify-between px-4 py-1.5 border-t border-slate-800 text-xs font-mono" style="background:#020617;">
              <div class="flex items-center gap-4">
                <span v-if="editorFocused" class="text-slate-300">Ln {{ cursorPos.line }}, Col {{ cursorPos.col }}</span>
                <span v-else class="text-slate-600 text-xs">Ctrl+S Save · Ctrl+/ Comment · Tab Indent</span>
              </div>
              <div class="text-slate-600">{{ lineCount }} lines</div>
            </div>
          </template>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const token = () => localStorage.getItem('pm2me_token')
const headers = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' })

// ─── State ─────────────────────────────────────
const info = ref({ os: '', confFile: '', confDir: '', installed: false, version: '' })
const status = ref({ running: false, checking: false })
const files = ref([])
const isWindows = ref(true)
const activeFile = ref(null)
const configContent = ref('')
const configDirty = ref(false)
const savingConfig = ref(false)
const actionLoading = ref(false)
const actionOutput = ref(null)
const actionSuccess = ref(false)
const togglingEnabled = ref(false)
const showNewFileInput = ref(false)
const newFileName = ref('')

const editorRef = ref(null)
const gutterRef = ref(null)
const scrollWrap = ref(null)
const editorFocused = ref(false)
const cursorPos = ref({ line: 1, col: 1 })

// ─── Nginx Syntax Highlighter ───────────────────
const KEYWORDS = /^(server_name|server|location|upstream|http|events|listen|root|index|include|proxy_pass|proxy_set_header|proxy_hide_header|proxy_redirect|proxy_connect_timeout|proxy_read_timeout|proxy_send_timeout|fastcgi_pass|fastcgi_param|fastcgi_index|ssl_certificate|ssl_certificate_key|ssl_protocols|ssl_ciphers|ssl_prefer_server_ciphers|ssl_session_cache|ssl_session_timeout|add_header|return|rewrite|if|set|map|geo|break|last|redirect|permanent|worker_processes|worker_connections|keepalive_timeout|keepalive|gzip|gzip_types|gzip_comp_level|gzip_min_length|gzip_vary|client_max_body_size|client_body_timeout|client_header_timeout|access_log|error_log|log_format|sendfile|tcp_nopush|tcp_nodelay|default_type|charset|expires|autoindex|alias|deny|allow|auth_basic|auth_basic_user_file|limit_req|limit_req_zone|limit_conn|limit_conn_zone|resolver|resolver_timeout|user|pid|daemon|types|pcre_jit|load_module|open_file_cache|open_file_cache_valid|error_page|try_files|internal|proxy_cache|proxy_cache_valid|proxy_buffering)\b/

const isBoundary = (ch) => !ch || /[\s;{}()"',]/.test(ch)

function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }

function highlightLine(raw) {
  const cm = raw.match(/^(\s*)(#.*)$/)
  if (cm) return `${esc(cm[1])}<span class="hl-comment">${esc(cm[2])}</span>`
  let result = '', i = 0
  while (i < raw.length) {
    const rest = raw.slice(i), prev = raw[i - 1]
    if (raw[i] === '#' && (i === 0 || /\s/.test(prev))) { result += `<span class="hl-comment">${esc(rest)}</span>`; break }
    if (raw[i] === '"') { let j=i+1; while(j<raw.length&&raw[j]!=='"'){if(raw[j]==='\\')j++;j++}; result+=`<span class="hl-string">${esc(raw.slice(i,j+1))}</span>`; i=j+1; continue }
    if (raw[i] === "'") { let j=i+1; while(j<raw.length&&raw[j]!=="'"){if(raw[j]==='\\')j++;j++}; result+=`<span class="hl-string">${esc(raw.slice(i,j+1))}</span>`; i=j+1; continue }
    if (raw[i] === '$') { const m=rest.match(/^(\$[a-zA-Z_][a-zA-Z0-9_]*)/); if(m){result+=`<span class="hl-variable">${esc(m[1])}</span>`;i+=m[1].length;continue} }
    const kw = rest.match(KEYWORDS)
    if (kw && isBoundary(prev) && isBoundary(raw[i + kw[1].length])) { result+=`<span class="hl-keyword">${kw[1]}</span>`; i+=kw[1].length; continue }
    const sp = rest.match(/^(on|off|none|any)\b/)
    if (sp && isBoundary(prev)) { result+=`<span class="hl-special">${sp[1]}</span>`; i+=sp[1].length; continue }
    if (/\d/.test(raw[i]) && isBoundary(prev)) { const nm=rest.match(/^(\d+[a-z]*)/); if(nm&&isBoundary(raw[i+nm[1].length])){result+=`<span class="hl-number">${nm[1]}</span>`;i+=nm[1].length;continue} }
    if (raw[i]==='{' || raw[i]==='}') { result+=`<span class="hl-brace">${raw[i]}</span>`;i++;continue }
    if (raw[i]===';') { result+=`<span class="hl-semi">;</span>`;i++;continue }
    result += esc(raw[i]); i++
  }
  return result
}

const highlighted = computed(() => configContent.value.split('\n').map(highlightLine).join('\n'))
const lineCount = computed(() => Math.max(1, configContent.value.split('\n').length))

// ─── Editor helpers ─────────────────────────────
const updateCursor = (e) => {
  const ta = e.target
  const text = ta.value.substring(0, ta.selectionStart)
  const lines = text.split('\n')
  cursorPos.value = { line: lines.length, col: lines[lines.length - 1].length + 1 }
}
const syncGutter = () => {
  if (!scrollWrap.value || !gutterRef.value) return
  gutterRef.value.scrollTop = scrollWrap.value.scrollTop
}
const syncHeight = async () => {
  await nextTick()
  if (!editorRef.value || !scrollWrap.value) return
  const spacer = scrollWrap.value.querySelector('[aria-hidden="true"]')
  if (spacer) editorRef.value.style.height = spacer.offsetHeight + 'px'
}
const onInput = (e) => { configDirty.value = true; updateCursor(e); syncHeight() }

const handleKeyDown = (e) => {
  const ta = e.target
  const { selectionStart: ss, selectionEnd: se, value } = ta

  if (e.key === 's' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); saveConfig(); return }

  if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey) {
    e.preventDefault()
    const indent = '  ', lines = value.split('\n')
    if (ss === se) {
      configContent.value = value.slice(0, ss) + indent + value.slice(se)
      nextTick(() => { ta.selectionStart = ta.selectionEnd = ss + indent.length; updateCursor({ target: ta }); syncHeight() })
    } else {
      let cc=0, startLine=0, endLine=0
      for (let i=0;i<lines.length;i++){const le=cc+lines[i].length;if(cc<=ss&&ss<=le+1)startLine=i;if(cc<=se&&se<=le+1)endLine=i;cc+=lines[i].length+1}
      const added=(endLine-startLine+1)*indent.length
      for (let i=startLine;i<=endLine;i++) lines[i]=e.shiftKey?lines[i].replace(new RegExp(`^ {1,${indent.length}}`),''):indent+lines[i]
      configContent.value = lines.join('\n')
      nextTick(() => { ta.selectionStart=ss+indent.length; ta.selectionEnd=se+added; updateCursor({target:ta}); syncHeight() })
    }
    configDirty.value = true; return
  }

  const isSlash = e.key === '/' || e.code === 'Slash' || e.code === 'NumpadDivide'
  if (isSlash && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    const lines = value.split('\n')
    let cc=0, startLine=0, endLine=0
    for (let i=0;i<lines.length;i++){const le=cc+lines[i].length;if(cc<=ss&&ss<=le+1)startLine=i;if(cc<=se&&se<=le+1)endLine=i;cc+=lines[i].length+1}
    if (endLine > startLine) { let lsp=0; for(let i=0;i<endLine;i++) lsp+=lines[i].length+1; if(se===lsp)endLine-- }
    while (endLine > startLine && lines[endLine].trim() === '') endLine--
    const nonBlank = lines.slice(startLine, endLine+1).filter(l=>l.trim()!=='')
    const allCommented = nonBlank.length > 0 && nonBlank.every(l=>/^\s*#/.test(l))
    for (let i=startLine;i<=endLine;i++) {
      if (lines[i].trim()==='') continue
      lines[i] = allCommented ? lines[i].replace(/^(\s*)# ?/,'$1') : lines[i].replace(/^(\s*)/,'$1# ')
    }
    configContent.value = lines.join('\n')
    configDirty.value = true
    const delta = allCommented ? -2 : 2
    nextTick(() => { ta.selectionStart=Math.max(0,ss+delta); ta.selectionEnd=Math.max(0,se+(endLine-startLine+1)*delta); updateCursor({target:ta}) })
    return
  }
}

// ─── API ────────────────────────────────────────
const fetchInfo = async () => {
  const res = await fetch('/api/nginx/info', { headers: headers() })
  info.value = await res.json()
}
const refreshStatus = async () => {
  status.value.checking = true
  try { status.value.running = (await (await fetch('/api/nginx/status', { headers: headers() })).json()).running }
  finally { status.value.checking = false }
}
const loadFiles = async () => {
  const res = await fetch('/api/nginx/files', { headers: headers() })
  const data = await res.json()
  files.value = data.files || []
  isWindows.value = data.isWindows
  if (!activeFile.value && files.value.length > 0) await selectFile(files.value[0])
}
const selectFile = async (f) => {
  if (configDirty.value && activeFile.value) {
    if (!confirm(`Discard unsaved changes to ${activeFile.value.name}?`)) return
  }
  activeFile.value = f
  configDirty.value = false
  await reloadConfig()
}
const reloadConfig = async () => {
  if (!activeFile.value) return
  const res = await fetch(`/api/nginx/config?file=${encodeURIComponent(activeFile.value.path)}`, { headers: headers() })
  const data = await res.json()
  configContent.value = data.content
  configDirty.value = false
  await syncHeight()
}
const saveConfig = async () => {
  if (!activeFile.value) return
  savingConfig.value = true
  try {
    await fetch('/api/nginx/config', { method: 'POST', headers: headers(), body: JSON.stringify({ content: configContent.value, file: activeFile.value.path }) })
    configDirty.value = false
  } finally { savingConfig.value = false }
}
const toggleEnabled = async () => {
  if (!activeFile.value) return
  togglingEnabled.value = true
  try {
    const url = activeFile.value.enabled ? '/api/nginx/disable' : '/api/nginx/enable'
    await fetch(url, { method: 'POST', headers: headers(), body: JSON.stringify({ filePath: activeFile.value.path, name: activeFile.value.name }) })
    await loadFiles()
    const updated = files.value.find(f => f.path === activeFile.value?.path)
    if (updated) activeFile.value = updated
  } finally { togglingEnabled.value = false }
}
const createNewFile = async () => {
  if (!newFileName.value.trim()) return
  const res = await fetch('/api/nginx/files/new', { method: 'POST', headers: headers(), body: JSON.stringify({ name: newFileName.value.trim() }) })
  const data = await res.json()
  showNewFileInput.value = false; newFileName.value = ''
  if (data.success) { await loadFiles(); const f = files.value.find(x => x.name === data.name); if(f) await selectFile(f) }
}
const deleteFile = async (f) => {
  if (!confirm(`Delete ${f.name}?`)) return
  await fetch('/api/nginx/files', { method: 'DELETE', headers: headers(), body: JSON.stringify({ filePath: f.path }) })
  if (activeFile.value?.path === f.path) { activeFile.value = null; configContent.value = '' }
  await loadFiles()
}
const runAction = async (action) => {
  actionLoading.value = true; actionOutput.value = null
  try {
    const res = await fetch('/api/nginx/action', { method: 'POST', headers: headers(), body: JSON.stringify({ action }) })
    const data = await res.json()
    actionOutput.value = data.output || data.error || ''; actionSuccess.value = data.success
    if (['start','reload','stop','quit'].includes(action)) setTimeout(refreshStatus, 800)
  } finally { actionLoading.value = false }
}

let statusInterval = null
onMounted(async () => {
  await fetchInfo()
  await refreshStatus()
  await loadFiles()
  statusInterval = setInterval(refreshStatus, 5000)
})
onUnmounted(() => clearInterval(statusInterval))
</script>

<style scoped>
.editor-line-height, .editor-textarea { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; line-height: 1.6; }
:deep(.hl-comment)  { color: #64748b; font-style: italic; }
:deep(.hl-keyword)  { color: #60a5fa; }
:deep(.hl-string)   { color: #fbbf24; }
:deep(.hl-special)  { color: #34d399; }
:deep(.hl-number)   { color: #c084fc; }
:deep(.hl-brace)    { color: #f59e0b; }
:deep(.hl-semi)     { color: #475569; }
:deep(.hl-variable) { color: #22d3ee; }
.editor-scroll::-webkit-scrollbar        { width: 8px; height: 8px; }
.editor-scroll::-webkit-scrollbar-track  { background: #020617; }
.editor-scroll::-webkit-scrollbar-thumb  { background: #334155; border-radius: 4px; border: 2px solid #020617; }
.editor-scroll::-webkit-scrollbar-thumb:hover { background: #475569; }
.editor-scroll::-webkit-scrollbar-corner { background: #020617; }
</style>
