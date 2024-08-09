import express from 'express';
import User from '../models/user.js';
import session from 'express-session';

const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const user = await User.findOne({ username });
        if (!user || !(await user.verifyPassword(password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Set session data including role
        req.session.username = username;
        req.session.role = user.role;

        res.status(200).json({ message: 'Login successful', username: username, role: user.role });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/session', (req, res) => {
    if (req.session.username) {
        res.status(200).json({ username: req.session.username, role: req.session.role });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Failed to log out' });
        }
        res.redirect('/'); // Redirect to the homepage after logging out
    });
});

export default router;
