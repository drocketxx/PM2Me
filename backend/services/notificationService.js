import db from '../db/index.js';

export const sendDiscordNotification = async (message) => {
    const { discordWebhook } = db.data.settings;
    if (!discordWebhook) return;

    try {
        await fetch(discordWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: message })
        });
    } catch (err) {
        console.error('Discord notification failed:', err);
    }
};

export const sendTelegramNotification = async (message) => {
    const { telegramBotToken, telegramChatId } = db.data.settings;
    if (!telegramBotToken || !telegramChatId) return;

    try {
        const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: telegramChatId, text: message })
        });
    } catch (err) {
        console.error('Telegram notification failed:', err);
    }
};

export const notifyAll = async (appName, status, error = null) => {
    let message = '';
    if (status === 'success') {
        message = `✅ **Deployment Success**\nApp \`${appName}\` has been successfully deployed and is now running.`;
    } else if (status === 'failed') {
        message = `❌ **Deployment Failed**\nApp \`${appName}\` failed to deploy.\nError: ${error}`;
    } else {
        message = `ℹ️ **App Status Update**\nApp \`${appName}\` is now ${status}.`;
    }

    await Promise.all([
        sendDiscordNotification(message),
        sendTelegramNotification(message)
    ]);
};
