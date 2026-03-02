#!/usr/bin/env node
import bcrypt from 'bcrypt';
import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const homeDir = path.join(os.homedir(), '.pm2me');
const dbPath = process.env.PM2ME_DB_PATH || path.join(homeDir, 'database.json');

const password = process.argv[2];
if (!password) {
    console.error('❌ Usage: npm run pw -- <new_password>');
    process.exit(1);
}

const defaultData = { apps: [], settings: {}, githubAccounts: [], webhookLogs: [], admin: { passwordHash: '' } };
const db = await JSONFilePreset(dbPath, defaultData);

const hash = await bcrypt.hash(password, 12);
db.data.admin.passwordHash = hash;
await db.write();

console.log(`✅ Admin password updated successfully!`);
