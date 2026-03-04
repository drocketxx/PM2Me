import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import apiRoutes from './routes/api.js';
import authRoutes from './routes/auth.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';
import pm2 from 'pm2';
import db from './db/index.js';
import { getSystemStats } from './services/systemService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

app.use(cors());
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(morgan('dev'));
app.use((req, res, next) => { req.io = io; next(); });

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

import history from 'connect-history-api-fallback';
app.use(history({
    index: '/index.html',
    rewrites: [{ from: /^\/api\/.*$/, to: (ctx) => ctx.parsedUrl.pathname }]
}));
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

// ── PM2 Log Streaming via `pm2 logs <name> --raw` ────────────────────────────
// Spawns the pm2 CLI directly (using node + pm2 bin path) so we get the exact
// same output as running `pm2 logs PM2Me-test` in your terminal — silently, no
// console windows.

const logProcesses = new Map(); // appId → ChildProcess

const getPm2BinPath = () => {
    try {
        // Find global node_modules to get pm2's actual JS entry point
        const root = execSync('npm root -g', { windowsHide: true, encoding: 'utf8' }).trim();
        const bin = path.join(root, 'pm2', 'bin', 'pm2');
        if (fs.existsSync(bin)) return bin;
    } catch { }
    return null;
};

const startLogStream = (appConfig) => {
    // Kill any existing stream for this app
    if (logProcesses.has(appConfig.id)) {
        try { logProcesses.get(appConfig.id).kill(); } catch { }
        logProcesses.delete(appConfig.id);
    }

    const pm2Bin = getPm2BinPath();
    if (!pm2Bin) {
        console.error('[LogStream] Could not find pm2 bin path');
        return;
    }

    // Run: node <pm2-bin> logs <appName> --raw --lines 0
    // --lines 0  → skip historical, only LIVE new output
    // --raw      → strip "0|appname |" prefix, just bare log lines
    const child = spawn(process.execPath, [pm2Bin, 'logs', appConfig.name, '--raw', '--lines', '0'], {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe']
    });

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    const onData = (type) => (data) => {
        const lines = data.split('\n').filter(l => l.trim());
        for (const line of lines) {
            const msg = type === 'err' ? `[stderr] ${line}` : line;
            io.emit(`pm2-log-${appConfig.id}`, msg);
        }
    };

    child.stdout.on('data', onData('out'));
    child.stderr.on('data', onData('err'));

    child.on('close', (code) => {
        console.log(`[LogStream] Stream closed for ${appConfig.name} (code ${code})`);
        logProcesses.delete(appConfig.id);
    });

    logProcesses.set(appConfig.id, child);
    console.log(`[LogStream] Streaming: pm2 logs ${appConfig.name} --raw --lines 0`);
};

const startAllLogStreams = () => {
    for (const appConfig of (db.data.apps || [])) {
        startLogStream(appConfig);
    }
};

// Export so deploy route can call this after a new app comes online
export const refreshLogStream = (appConfig) => {
    // Give PM2 a moment to start the new process before streaming
    setTimeout(() => startLogStream(appConfig), 1500);
};

// ── PM2 Event Bus (for deployment events only, NOT log streaming) ─────────────
const initPm2Bus = () => {
    pm2.connect((err) => {
        if (err) { console.error('[PM2] Failed to connect:', err); return; }
        console.log('[PM2] Connected.');

        pm2.launchBus((err, pm2_bus) => {
            if (err) { console.error('[PM2] Bus error:', err); return; }
            console.log('[PM2] Event Bus ready');

            // Re-start log stream when a managed app comes online (e.g. after deploy/restart)
            pm2_bus.on('process:event', (packet) => {
                if (packet.event === 'online') {
                    const appName = packet.process?.name;
                    const appConfig = db.data.apps?.find(a => a.name === appName);
                    if (appConfig) {
                        console.log(`[PM2] ${appName} came online — restarting log stream`);
                        setTimeout(() => startLogStream(appConfig), 1000);
                    }
                }
            });
        });
    });
};

const PORT = process.env.PORT || 12345;
server.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    initPm2Bus();
    startAllLogStreams();

    // System stats broadcast
    const broadcastStats = async () => {
        try { io.emit('system-stats', await getSystemStats()); }
        catch (e) { console.error('Stats error:', e); }
        finally { setTimeout(broadcastStats, 1000); }
    };
    broadcastStats();
});
