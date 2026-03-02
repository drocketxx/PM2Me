# PM2Me 🚀

> A self-hosted, premium web dashboard for deploying and managing Node.js applications via PM2.

PM2Me lets you **deploy apps directly from a GitHub repository**, manage PM2 processes, monitor your server in real-time, and receive webhook-triggered auto-deployments — all from a beautiful, dark-mode UI.

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/rocketx.x)

![PM2Me Dashboard](screenshot/001.png)

---

## 🚀 Quick Start (Global Install)

The easiest way to use PM2Me is to install it globally via npm:

```bash
# 1. Install globally
npm install -g @drocketxx/pm2me

# 2. Run the server
pm2me
```

Open your browser at: **http://localhost:12345**

---

## 🛠️ Running as a Background Service

If you want PM2Me to run in the background and start automatically on system boot, use the built-in `service` command:

```bash
# Install as a background service (using PM2)
pm2me service install

# To remove the background service
pm2me service uninstall
```

> **Note:** The `service install` command will register PM2Me as `pm2me-server` in PM2 and attempt to set up system startup.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🖥 **Dashboard** | View all PM2 apps with real-time status, CPU, memory, uptime |
| 🚀 **Deploy from GitHub** | Clone & deploy any GitHub repo with PAT authentication |
| 🔄 **Auto-Sync via Webhook** | Automatically re-deploy on `git push` using GitHub Webhooks |
| 📊 **Server Monitor** | Real-time CPU, RAM, Disk, Network, and System Uptime via Socket.IO |
| 📜 **Live Logs** | Stream PM2 app logs in the browser in real-time |
| 🔔 **Notifications** | Deployment alerts via Discord Webhook or Telegram Bot |
| 🔐 **Admin Login** | Secure JWT-based authentication with bcrypt hashed passwords |
| ⚙️ **Settings Page** | Manage GitHub accounts, webhook secrets, and notification integrations |
| 📋 **Webhook History** | Last 50 webhook events logged and updated in real-time |
| 🗑 **Delete/Stop/Restart** | Full PM2 lifecycle management with a premium custom UI |

---

## 🧱 Tech Stack

**Backend**
- [Express.js](https://expressjs.com/) — REST API server
- [Socket.IO](https://socket.io/) — Real-time log streaming & system stats
- [PM2](https://pm2.keymetrics.io/) — Process management (`pm2` Node.js API)
- [LowDB](https://github.com/typicode/lowdb) — Lightweight JSON file database
- [bcrypt](https://www.npmjs.com/package/bcrypt) — Password hashing
- [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) — JWT Auth
- [simple-git](https://github.com/steveukx/git-js) — Git operations

**Frontend**
- [Vue 3](https://vuejs.org/) — Reactive UI
- [Vite](https://vitejs.dev/) — Build tool
- [Socket.IO Client](https://socket.io/docs/v4/client-api/) — Real-time updates

---

## 🔐 Setup & Security

### First Run
On your first run, PM2Me will guide you through a **Setup Wizard** to configure your apps storage path and set your admin password.

### Data Storage
- **Database:** Stored in `~/.pm2me/database.json`
- **Cloned Apps:** Default to `~/.pm2me/apps/` (User configurable)

### GitHub Webhooks
1. Go to your GitHub repository → **Settings** → **Webhooks** → **Add webhook**
2. Set **Payload URL** to: `http://your-server-ip:12345/api/webhook`
3. Set **Content type** to: **`application/json`** ⚠️
4. Set **Secret** from the Settings page in PM2Me
5. Select **Just the push event**

---

## 🛠️ Manual Installation (For Developers)

If you want to contribute or run from source:

```bash
# 1. Clone the repository
git clone https://github.com/drocketxx/PM2Me.git
cd PM2Me

# 2. Install all dependencies
npm run install:all

# 3. Build the frontend
npm run build

# 4. Start in development mode
npm run dev
```

---

## 🛡 Security Notes

- Set a strong admin password during the setup wizard.
- Always use a **Webhook Secret** to prevent unauthorized deployment triggers.
- Consider putting PM2Me behind a reverse proxy (e.g., Nginx) with HTTPS in production.

---

## 📄 License

MIT
