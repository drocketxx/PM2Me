import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const homeDir = path.join(os.homedir(), '.pm2me');
const dbPath = process.env.PM2ME_DB_PATH || path.join(homeDir, 'database.json');

// Ensure directory exists
fs.mkdirSync(homeDir, { recursive: true });
console.log("🚀 ~ homeDir:", homeDir)

const defaultData = {
    apps: [],
    settings: {
        webhookSecret: '',
        discordWebhook: '',
        telegramBotToken: '',
        telegramChatId: '',
        appsPath: '',          // Set during Setup Wizard
    },
    githubAccounts: [],
    webhookLogs: [],
    admin: {
        passwordHash: '',
    },
    setupComplete: false,    // true after Setup Wizard finishes
};

// Initialize DB with node preset
console.log('Database path:', dbPath);
const db = await JSONFilePreset(dbPath, defaultData);

// Cleanup stuck deploying status from previous crash/restart
let needsWrite = false;
if (db.data && db.data.apps) {
    db.data.apps.forEach(app => {
        if (app.status === 'deploying') {
            app.status = 'failed'; // Reset stuck deploys
            needsWrite = true;
        }
    });
}
if (needsWrite) {
    await db.write();
}

export default db;
