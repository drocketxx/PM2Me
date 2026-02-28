import express from 'express';
import db from '../db/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-pm2me-key-2026';

router.post('/login', async (req, res) => {
    const { password } = req.body;
    const adminConfig = db.data.admin;

    if (!adminConfig || !adminConfig.passwordHash) {
        // If no password is set, the first login attempts sets it
        const hash = await bcrypt.hash(password, 10);
        db.data.admin.passwordHash = hash;
        await db.write();
        const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
        return res.json({ token, message: 'Admin password set successfully and logged in' });
    }

    const match = await bcrypt.compare(password, adminConfig.passwordHash);
    if (!match) {
        return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
});

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

export default router;
