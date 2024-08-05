import express from 'express';
import Report from '../models/report.js';

const router = express.Router();

// GET request to retrieve all reports
router.get('/', async (req, res) => {
    console.log('GET request to /reports');
    try {
        const reports = await Report.find();
        res.json(reports);
    } catch (err) {
        console.error('Error fetching reports:', err);
        res.status(500).json({ message: err.message });
    }
});

// POST request to create a report
router.post('/', async (req, res) => {
    const { username, items, totalPrice, employeeName, action } = req.body;

    // Input validation
    if (!username || !items || !action) {
        console.error('Missing required fields:', { username, items, action });
        return res.status(400).json({ message: 'Missing required fields: username, items, and action' });
    }

    // Log the incoming data for debugging
    console.log('Creating report with data:', { username, items, totalPrice, employeeName, action });

    try {
        const newReport = new Report({
            username,
            items,
            totalPrice: totalPrice || 0, // Default to 0 if not provided
            employeeName: employeeName || '', // Default to empty string if not provided
            action
        });

        const savedReport = await newReport.save();
        res.status(201).json(savedReport);
    } catch (err) {
        console.error('Error creating report:', err);
        res.status(500).json({ message: 'Failed to create report', error: err.message });
    }
});

// DELETE request to delete all reports
router.delete('/', async (req, res) => {
    console.log('DELETE request to /reports');
    try {
        await Report.deleteMany({});
        res.status(200).json({ message: 'All reports deleted successfully' });
    } catch (err) {
        console.error('Error deleting reports:', err);
        res.status(500).json({ message: 'Failed to delete reports', error: err.message });
    }
});

export default router;
