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
        <button @click="refreshStatus" :disabled="status.checking"
          class="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800">
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
        <p class="text-xs text-slate-500 mb-1">Config File</p>
        <p class="text-xs font-mono text-slate-300 break-all">{{ info.confFile }}</p>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="bg-slate-800/60 rounded-2xl border border-slate-700 p-5">
      <h2 class="text-sm font-semibold text-slate-300 mb-4">Process Control</h2>
      <div class="flex flex-wrap gap-3">
        <button @click="runAction('test')" :disabled="actionLoading"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-400 disabled:opacity-50">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Test Config
        </button>
        <button @click="runAction('start')" :disabled="actionLoading || status.running"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-400 disabled:opacity-30">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Start
        </button>
        <button @click="runAction('reload')" :disabled="actionLoading || !status.running"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/30 text-amber-400 disabled:opacity-30">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          Reload
        </button>
        <button @click="runAction('quit')" :disabled="actionLoading || !status.running"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-300 disabled:opacity-30">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/></svg>
          Quit
        </button>
        <button @click="runAction('stop')" :disabled="actionLoading || !status.running"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-400 disabled:opacity-30">
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

    <!-- Config Editor -->
    <div class="bg-slate-800/60 rounded-2xl border border-slate-700 overflow-hidden">
      <!-- Toolbar -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-700">
        <div class="flex items-center gap-3">
          <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <span class="text-sm font-semibold text-slate-300">nginx.conf</span>
          <span class="text-xs font-mono text-slate-500">{{ info.confFile }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span v-if="configDirty" class="text-xs text-amber-400 flex items-center gap-1">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4"/></svg>
            Unsaved
          </span>
          <button @click="saveConfig" :disabled="savingConfig || !configDirty"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-40">
            <svg v-if="!savingConfig" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
            <svg v-else class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
            Save
          </button>
          <button @click="loadConfig"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 transition-all">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
            Reload
          </button>
        </div>
      </div>

      <div v-if="!configExists" class="px-5 py-3 text-sm text-amber-400 flex items-center gap-2 border-b border-slate-700/50">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.75-2.96L13.75 4a2 2 0 00-3.5 0L3.25 16.04A2 2 0 005.07 19z"/></svg>
        Config file not found at <code class="font-mono ml-1">{{ info.confFile }}</code>
      </div>

      <!-- Editor: gutter + code area -->
      <div class="flex bg-slate-950" style="height: 560px; overflow: hidden;">
        <!-- Line Numbers Gutter -->
        <div ref="gutterRef"
          class="select-none flex-shrink-0 text-right font-mono bg-slate-950 border-r border-slate-800"
          style="min-width: 3.5rem; overflow: hidden; pointer-events: none; padding: 12px 12px 12px 8px;">
          <div v-for="n in lineCount" :key="n"
            class="editor-line"
            :class="n === cursorPos.line && editorFocused ? 'text-slate-300' : 'text-slate-600'">{{ n }}</div>
        </div>

        <!-- Scroll wrapper owns the scrollbar -->
        <div ref="scrollWrap" class="relative flex-1 editor-scroll"
          style="overflow-y: scroll; overflow-x: auto;" @scroll="syncGutter">

          <!-- Invisible spacer: sets scroll height -->
          <div aria-hidden="true" class="editor-line-height invisible pointer-events-none whitespace-pre"
            style="padding: 12px 16px;"
            v-text="configContent + '\n'"></div>

          <!-- Highlighted pre: absolute, behind textarea -->
          <pre ref="highlightPre" aria-hidden="true"
            class="absolute top-0 left-0 w-full m-0 pointer-events-none editor-line-height whitespace-pre"
            style="padding: 12px 16px;"
            v-html="highlighted"></pre>

          <!-- Textarea: transparent text, on top -->
          <textarea ref="editorRef" v-model="configContent"
            @input="onInput"
            @click="updateCursor($event)"
            @keydown="handleKeyDown"
            @keyup="updateCursor($event)"
            @focus="editorFocused = true"
            @blur="editorFocused = false"
            spellcheck="false"
            class="absolute top-0 left-0 w-full focus:outline-none resize-none editor-textarea editor-line-height"
            style="padding: 12px 16px; height: 100%; caret-color: #60a5fa; color: transparent; background: transparent; tab-size: 4; white-space: pre; overflow: hidden; z-index: 1;"
            placeholder=""></textarea>
        </div>
      </div>

      <!-- Status bar -->
      <div class="flex items-center justify-between px-4 py-1.5 bg-slate-950 border-t border-slate-800 text-xs font-mono">
        <div class="flex items-center gap-4">
          <span v-if="editorFocused" class="text-slate-300">Ln {{ cursorPos.line }}, Col {{ cursorPos.col }}</span>
          <span v-else class="text-slate-600">nginx config</span>
        </div>
        <div class="text-slate-600">{{ lineCount }} lines</div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const token = () => localStorage.getItem('pm2me_token')
const headers = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' })

// ─── State ────────────────────────────────────────────────────────────────────
const info = ref({ os: '', confFile: '', confDir: '', installed: false, version: '' })
const status = ref({ running: false, checking: false })
const configContent = ref('')
const configExists = ref(true)
const editorRef = ref(null)
const gutterRef = ref(null)
const scrollWrap = ref(null)
const highlightPre = ref(null)
const editorFocused = ref(false)
const cursorPos = ref({ line: 1, col: 1 })
const configDirty = ref(false)
const savingConfig = ref(false)
const actionLoading = ref(false)
const actionOutput = ref(null)
const actionSuccess = ref(false)

// ─── Nginx Syntax Highlighter ─────────────────────────────────────────────────
const KEYWORDS = /^(server_name|server|location|upstream|http|events|listen|root|index|include|proxy_pass|proxy_set_header|proxy_hide_header|proxy_redirect|proxy_connect_timeout|proxy_read_timeout|proxy_send_timeout|fastcgi_pass|fastcgi_param|fastcgi_index|ssl_certificate|ssl_certificate_key|ssl_protocols|ssl_ciphers|ssl_prefer_server_ciphers|ssl_session_cache|ssl_session_timeout|add_header|return|rewrite|if|set|map|geo|break|last|redirect|permanent|worker_processes|worker_connections|keepalive_timeout|keepalive|gzip|gzip_types|gzip_comp_level|gzip_min_length|gzip_vary|client_max_body_size|client_body_timeout|client_header_timeout|access_log|error_log|log_format|sendfile|tcp_nopush|tcp_nodelay|default_type|charset|expires|autoindex|alias|deny|allow|auth_basic|auth_basic_user_file|limit_req|limit_req_zone|limit_conn|limit_conn_zone|resolver|resolver_timeout|user|pid|daemon|types|pcre_jit|load_module|open_file_cache|open_file_cache_valid|error_page|try_files|internal|sub_filter|sub_filter_once|more_set_headers|proxy_cache|proxy_cache_valid|proxy_cache_bypass|proxy_no_cache|proxy_buffering|proxy_buffer_size|proxy_buffers)\b/

const isBoundary = (ch) => !ch || /[\s;{}()"',]/.test(ch)

function highlightLine(raw) {
  // Whole-line comment
  const commentMatch = raw.match(/^(\s*)(#.*)$/)
  if (commentMatch) {
    return `${esc(commentMatch[1])}<span class="hl-comment">${esc(commentMatch[2])}</span>`
  }

  let result = ''
  let i = 0

  while (i < raw.length) {
    const rest = raw.slice(i)
    const prevCh = raw[i - 1]

    // Inline comment (# preceded by whitespace)
    if (raw[i] === '#' && (i === 0 || /\s/.test(prevCh))) {
      result += `<span class="hl-comment">${esc(rest)}</span>`
      break
    }

    // Double-quoted string
    if (raw[i] === '"') {
      let j = i + 1
      while (j < raw.length && raw[j] !== '"') { if (raw[j] === '\\') j++; j++ }
      result += `<span class="hl-string">${esc(raw.slice(i, j + 1))}</span>`
      i = j + 1; continue
    }

    // Single-quoted string
    if (raw[i] === "'") {
      let j = i + 1
      while (j < raw.length && raw[j] !== "'") { if (raw[j] === '\\') j++; j++ }
      result += `<span class="hl-string">${esc(raw.slice(i, j + 1))}</span>`
      i = j + 1; continue
    }

    // Nginx variable  $varname
    if (raw[i] === '$') {
      const varMatch = rest.match(/^(\$[a-zA-Z_][a-zA-Z0-9_]*)/)
      if (varMatch) {
        result += `<span class="hl-variable">${esc(varMatch[1])}</span>`
        i += varMatch[1].length; continue
      }
    }

    // Keyword — only at word boundary (prev must be whitespace/start, next must be boundary)
    const kwMatch = rest.match(KEYWORDS)
    if (kwMatch && isBoundary(prevCh) && isBoundary(raw[i + kwMatch[1].length])) {
      result += `<span class="hl-keyword">${kwMatch[1]}</span>`
      i += kwMatch[1].length; continue
    }

    // Special values — only as whole words after whitespace
    const specialMatch = rest.match(/^(on|off|none|any)\b/)
    if (specialMatch && isBoundary(prevCh)) {
      result += `<span class="hl-special">${specialMatch[1]}</span>`
      i += specialMatch[1].length; continue
    }

    // Numbers — only standalone (after whitespace/start, not inside IP/path/version)
    if (/\d/.test(raw[i]) && isBoundary(prevCh)) {
      const numMatch = rest.match(/^(\d+[a-z]*)/)
      if (numMatch && isBoundary(raw[i + numMatch[1].length])) {
        result += `<span class="hl-number">${numMatch[1]}</span>`
        i += numMatch[1].length; continue
      }
    }

    // Braces
    if (raw[i] === '{' || raw[i] === '}') {
      result += `<span class="hl-brace">${raw[i]}</span>`; i++; continue
    }

    // Semicolons
    if (raw[i] === ';') {
      result += `<span class="hl-semi">;</span>`; i++; continue
    }

    // Default character
    result += esc(raw[i]); i++
  }
  return result
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const highlighted = computed(() => {
  return configContent.value.split('\n').map(highlightLine).join('\n')
})

// ─── Editor helpers ───────────────────────────────────────────────────────────
const lineCount = computed(() => Math.max(1, configContent.value.split('\n').length))

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

// Sync textarea height to spacer height so clicks work on all lines
const syncHeight = async () => {
  await nextTick()
  if (!editorRef.value || !scrollWrap.value) return
  const spacer = scrollWrap.value.querySelector('[aria-hidden="true"]')
  if (spacer) editorRef.value.style.height = spacer.offsetHeight + 'px'
}

const onInput = (e) => {
  configDirty.value = true
  updateCursor(e)
  syncHeight()
}

// ─── Keyboard shortcuts ───────────────────────────────────────────────────────
const handleKeyDown = (e) => {
  const ta = e.target
  const { selectionStart: ss, selectionEnd: se, value } = ta

  // Ctrl+S → Save config
  if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    saveConfig()
    return
  }

  // Tab → indent (no selection = insert spaces, with selection = indent lines)
  if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey) {
    e.preventDefault()
    const indent = '  '
    const lines = value.split('\n')

    if (ss === se) {
      // No selection: insert 2 spaces at cursor
      const newVal = value.slice(0, ss) + indent + value.slice(se)
      configContent.value = newVal
      nextTick(() => {
        ta.selectionStart = ta.selectionEnd = ss + indent.length
        updateCursor({ target: ta })
        syncHeight()
      })
    } else {
      // Has selection: indent all selected lines
      let charCount = 0
      let startLine = 0, endLine = 0
      for (let i = 0; i < lines.length; i++) {
        const lineEnd = charCount + lines[i].length
        if (charCount <= ss && ss <= lineEnd + 1) startLine = i
        if (charCount <= se && se <= lineEnd + 1) endLine = i
        charCount += lines[i].length + 1
      }
      const added = (endLine - startLine + 1) * indent.length
      if (e.shiftKey) {
        // Shift+Tab: dedent
        for (let i = startLine; i <= endLine; i++) {
          lines[i] = lines[i].replace(new RegExp(`^ {1,${indent.length}}`), '')
        }
      } else {
        for (let i = startLine; i <= endLine; i++) {
          lines[i] = indent + lines[i]
        }
      }
      configContent.value = lines.join('\n')
      nextTick(() => {
        ta.selectionStart = ss + indent.length
        ta.selectionEnd = se + added
        updateCursor({ target: ta })
        syncHeight()
      })
    }
    configDirty.value = true
    return
  }

  // Shift+Tab → dedent (no selection case)
  if (e.key === 'Tab' && e.shiftKey) {
    e.preventDefault()
    return
  }

  // Ctrl+/ (or Cmd+/) → toggle comment — use e.code for layout independence
  const isSlash = e.key === '/' || e.code === 'Slash' || e.code === 'NumpadDivide'
  if (isSlash && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    const lines = value.split('\n')

    // Find line range from selection
    let charCount = 0
    let startLine = 0, endLine = 0
    for (let i = 0; i < lines.length; i++) {
      const lineEnd = charCount + lines[i].length
      if (charCount <= ss && ss <= lineEnd + 1) startLine = i
      if (charCount <= se && se <= lineEnd + 1) endLine = i
      charCount += lines[i].length + 1
    }

    // Trim endLine: if selectionEnd is at the very START of endLine, or if
    // trailing lines in selection are blank — don't include them
    if (endLine > startLine) {
      let lineStartPos = 0
      for (let i = 0; i < endLine; i++) lineStartPos += lines[i].length + 1
      if (se === lineStartPos) endLine--
    }
    // Also trim trailing blank lines from selection
    while (endLine > startLine && lines[endLine].trim() === '') endLine--

    // Check if ALL non-blank selected lines are commented → uncomment, else comment
    const selectedLines = lines.slice(startLine, endLine + 1)
    const nonBlank = selectedLines.filter(l => l.trim() !== '')
    const allCommented = nonBlank.length > 0 && nonBlank.every(l => /^\s*#/.test(l))

    for (let i = startLine; i <= endLine; i++) {
      if (lines[i].trim() === '') continue  // skip blank lines
      if (allCommented) {
        // Remove leading "# " or just "#"
        lines[i] = lines[i].replace(/^(\s*)# ?/, '$1')
      } else {
        // Add "# " after leading whitespace
        lines[i] = lines[i].replace(/^(\s*)/, '$1# ')
      }
    }

    const newVal = lines.join('\n')
    configContent.value = newVal
    configDirty.value = true
    nextTick(() => {
      // Each affected line gained/lost 2 chars ("# ")
      const delta = allCommented ? -2 : 2
      ta.selectionStart = Math.max(0, ss + delta)
      ta.selectionEnd   = Math.max(0, se + (endLine - startLine + 1) * delta)
      updateCursor({ target: ta })
    })
    return
  }
}

// ─── API ──────────────────────────────────────────────────────────────────────
const fetchInfo = async () => {
  const res = await fetch('/api/nginx/info', { headers: headers() })
  info.value = await res.json()
}

const refreshStatus = async () => {
  status.value.checking = true
  try {
    const res = await fetch('/api/nginx/status', { headers: headers() })
    status.value.running = (await res.json()).running
  } finally { status.value.checking = false }
}

const loadConfig = async () => {
  const res = await fetch('/api/nginx/config', { headers: headers() })
  const data = await res.json()
  configContent.value = data.content
  configExists.value = data.exists
  configDirty.value = false
  await syncHeight()
}

const saveConfig = async () => {
  savingConfig.value = true
  try {
    await fetch('/api/nginx/config', {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ content: configContent.value })
    })
    configDirty.value = false
  } finally { savingConfig.value = false }
}

const runAction = async (action) => {
  actionLoading.value = true
  actionOutput.value = null
  try {
    const res = await fetch('/api/nginx/action', {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ action })
    })
    const data = await res.json()
    actionOutput.value = data.output || data.error || ''
    actionSuccess.value = data.success
    if (['start', 'reload', 'stop', 'quit'].includes(action)) setTimeout(refreshStatus, 800)
  } finally { actionLoading.value = false }
}

let statusInterval = null
onMounted(async () => {
  await fetchInfo()
  await refreshStatus()
  await loadConfig()
  statusInterval = setInterval(refreshStatus, 5000)
})
onUnmounted(() => clearInterval(statusInterval))
</script>

<style scoped>
/* Shared font for editor, gutter, pre, textarea */
.editor-line-height, .editor-textarea, .editor-line { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; line-height: 1.6; }

/* Syntax highlight colors */
:deep(.hl-comment)  { color: #64748b; font-style: italic; }
:deep(.hl-keyword)  { color: #60a5fa; }
:deep(.hl-string)   { color: #fbbf24; }
:deep(.hl-special)  { color: #34d399; }
:deep(.hl-number)   { color: #c084fc; }
:deep(.hl-brace)    { color: #f59e0b; }
:deep(.hl-semi)     { color: #475569; }
:deep(.hl-variable) { color: #22d3ee; } /* cyan — $varname */

/* Dark scrollbar */
.editor-scroll::-webkit-scrollbar        { width: 8px; height: 8px; }
.editor-scroll::-webkit-scrollbar-track  { background: #020617; }
.editor-scroll::-webkit-scrollbar-thumb  { background: #334155; border-radius: 4px; border: 2px solid #020617; }
.editor-scroll::-webkit-scrollbar-thumb:hover { background: #475569; }
.editor-scroll::-webkit-scrollbar-corner { background: #020617; }
</style>
