import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import apiRoutes from './routes/api.js';
import authRoutes, { authenticateToken } from './routes/auth.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pm2 from 'pm2';
import db from './db/index.js';
import { getSystemStats } from './services/systemService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(morgan('dev'));

// Provide io instance to routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes); // optionally add authenticateToken here

import history from 'connect-history-api-fallback';

// Serve Vue Frontend
app.use(history({
    index: '/index.html',
    rewrites: [
        { from: /^\/api\/.*$/, to: function (context) { return context.parsedUrl.pathname; } }
    ]
}));
app.use(express.static(path.join(__dirname, 'public')));

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 12345;
server.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);

    // Connect to PM2 Event Bus for real-time logs
    pm2.connect((err) => {
        if (err) {
            console.error('Failed to connect to PM2 for log streaming:', err);
            return;
        }

        pm2.launchBus((err, pm2_bus) => {
            if (err) {
                console.error('Failed to launch PM2 bus:', err);
                return;
            }

            console.log('PM2 Event Bus launched successfully');

            const broadcastLog = (type, packet) => {
                const appName = packet.process.name;
                const appConfig = db.data.apps.find(a => a.name === appName);
                if (appConfig) {
                    const prefix = type === 'out' ? '[out]' : '[err]';
                    let text = packet.data;
                    if (typeof text !== 'string') text = text.toString();
                    io.emit(`deploy-log-${appConfig.id}`, `${prefix} | ${text.trim()}`);
                }
            };

            pm2_bus.on('log:out', (packet) => broadcastLog('out', packet));
            pm2_bus.on('log:err', (packet) => broadcastLog('err', packet));
        });
    });

    // Broadcast system stats every 1 second
    const broadcastStats = async () => {
        try {
            const stats = await getSystemStats();
            io.emit('system-stats', stats);
        } catch (e) {
            console.error('Failed to broadcast system stats:', e);
        } finally {
            setTimeout(broadcastStats, 1000); // Wait 1 second after completion
        }
    };
    broadcastStats();
});
