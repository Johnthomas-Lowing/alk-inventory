import express from 'express';
import Employee from '../models/employee.js';

const router = express.Router();

// Get all employees or filter by name
router.get('/', async (req, res) => {
    try {
        const { name } = req.query;

        // If 'name' query parameter is present, filter by name
        if (name) {
            const employees = await Employee.find({ name: new RegExp(name, 'i') }); // Case-insensitive search
            return res.json(employees);
        }

        // Get all employees if no name query parameter is provided
        const employees = await Employee.find();
        res.json(employees);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get an employee by ID
router.get('/:id', async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (employee) {
            res.json(employee);
        } else {
            res.status(404).json({ message: 'Employee not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new employee
router.post('/', async (req, res) => {
    const { name, location } = req.body;

    // Input validation
    if (!name || !location) {
        return res.status(400).json({ message: 'Name and location are required' });
    }

    try {
        // Check if the employee already exists
        const existingEmployee = await Employee.findOne({ name });
        if (existingEmployee) {
            return res.status(400).json({ message: 'Employee already exists' });
        }

        // Create the new employee
        const employee = new Employee({ name, location });
        const newEmployee = await employee.save();

        res.status(201).json(newEmployee);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update an employee
router.put('/:id', async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (employee) {
            employee.name = req.body.name || employee.name;
            employee.location = req.body.location || employee.location;
            // Update more fields as needed

            const updatedEmployee = await employee.save();
            res.json(updatedEmployee);
        } else {
            res.status(404).json({ message: 'Employee not found' });
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete an employee
router.delete('/:id', async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (employee) {
            await employee.remove();
            res.json({ message: 'Employee deleted' });
        } else {
            res.status(404).json({ message: 'Employee not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;