import express from 'express';
import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import path from 'path';

const router = express.Router();

// POST request for user creation
router.post('/', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Create a new user instance
    const user = new User({ username, password });

    // Save the user to the database
    await user.save();

    // Send a success response
    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    // Send an error response
    res.status(500).json({ message: 'An error occurred', error });
  }
});

// GET request to retrieve all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET request to read user by ID
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE request to delete user by ID
router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: `User with ID ${req.params.id} deleted successfully` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
