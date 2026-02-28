import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'database.json');

const defaultData = {
    apps: [],
    settings: {
        webhookSecret: '',
        discordWebhook: '',
        telegramBotToken: '',
        telegramChatId: '',
    },
    githubAccounts: [],
    admin: {
        passwordHash: '', // Store hashed password
    }
};

// Initialize DB with node preset
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
