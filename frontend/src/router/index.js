import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import Settings from '../views/Settings.vue'
import Nginx from '../views/Nginx.vue'
import Setup from '../views/Setup.vue'

const routes = [
    { path: '/setup', name: 'Setup', component: Setup },
    { path: '/login', name: 'Login', component: Login },
    { path: '/', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true } },
    { path: '/nginx', name: 'Nginx', component: Nginx, meta: { requiresAuth: true } },
    { path: '/settings', name: 'Settings', component: Settings, meta: { requiresAuth: true } }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach(async (to, from, next) => {
    // Always check setup status fresh on each navigation
    // (so reload after setup complete works correctly)
    let needsSetup = false
    try {
        const res = await fetch('/api/setup/status')
        const data = await res.json()
        needsSetup = data.needsSetup
    } catch {
        needsSetup = false
    }

    // If setup is complete and user tries to visit /setup, redirect to login
    if (!needsSetup && to.name === 'Setup') {
        return next({ name: 'Login' })
    }

    // If setup is needed, redirect everything to /setup
    if (needsSetup && to.name !== 'Setup') {
        return next({ name: 'Setup' })
    }

    const token = localStorage.getItem('pm2me_token')
    if (to.meta.requiresAuth && !token) {
        return next({ name: 'Login' })
    }

    next()
})

export default router
