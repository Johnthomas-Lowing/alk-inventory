import express from 'express';
import Item from '../models/Item.js'; // Ensure this path is correct

const router = express.Router();

// Function to convert strings to Title Case
function toTitleCase(str) {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

// Route to get items based on query parameters or all items if no parameters are provided
router.get('/items', async (req, res) => {
    try {
        const { name, size, color, location, id } = req.query;

        // If an id is provided, fetch the item by id
        if (id) {
            const item = await Item.findById(id);
            if (item) {
                return res.json(item); // Return the single item
            } else {
                return res.status(404).json({ message: 'Item not found' });
            }
        }

        // Existing filters for name, size, color, and location
        let filter = {};
        if (name) filter.name = name;
        if (size) filter.size = size;
        if (color) filter.color = color;
        if (location && location !== 'all') filter.location = location;

        // Find items based on the filter criteria
        const items = await Item.find(filter);

        if (items.length > 0) {
            res.json(items);
        } else {
            res.status(404).json({ message: 'No items found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route to filter items with various criteria
router.get('/filter', async (req, res) => {
    const { name, color, size, location, quantity } = req.query;
    let filter = {};

    if (name) filter.name = new RegExp(toTitleCase(name), 'i'); // Case-insensitive search
    if (color) filter.color = new RegExp(toTitleCase(color), 'i');
    if (size) filter.size = new RegExp(toTitleCase(size), 'i');
    if (location) filter.location = new RegExp(toTitleCase(location), 'i');
    if (quantity) filter.quantity = quantity;

    try {
        const items = await Item.find(filter);
        res.json(items);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to filter inventory' });
    }
});

// Route to update item quantity
router.post('/items/updateQuantity', async (req, res) => {
    console.log('Received update request:', req.body);
    try {
        const { name, size, color, quantity } = req.body;

        console.log('Received update request:', { name, size, color, quantity });

        // Find the item first
        const item = await Item.findOne({ name, size, color });

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        // Check if the quantity needs to be updated
        if (item.quantity === parseInt(quantity, 10)) {
            return res.json({ success: true, message: 'Quantity already set to this value' });
        }

        // Update the quantity
        const result = await Item.updateOne(
            { name, size, color },
            { $set: { quantity: parseInt(quantity, 10) } }
        );

        console.log('Update result:', result);

        // Ensure the update result is checked correctly
        if (result.modifiedCount > 0 || result.matchedCount > 0) {
            res.json({ success: true, message: 'Quantity updated successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Item not found' });
        }
    } catch (error) {
        console.error('Error updating quantity:', error);
        res.status(500).json({ message: error.message });
    }
});

// Route to add multiple items
router.post('/items/bulk', async (req, res) => {
    try {
        const items = req.body; // Get the list of items from the request body

        // Validate that items is an array
        if (!Array.isArray(items)) {
            return res.status(400).json({ message: 'Request body must be an array of items.' });
        }

        // Insert multiple items into the database
        const result = await Item.insertMany(items);

        // Respond with the inserted items
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route to delete an item by ID
router.delete('/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Item.deleteOne({ _id: id });

        if (result.deletedCount > 0) {
            res.json({ success: true, message: 'Item deleted successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Item not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST request to delete multiple inventory items by IDs
router.post('/delete', async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'No IDs provided for deletion' });
    }

    try {
        const result = await Item.deleteMany({ _id: { $in: ids } });
        res.json({ message: 'Items deleted successfully', result });
    } catch (error) {
        console.error('Error deleting items:', error);
        res.status(500).json({ message: 'Failed to delete items' });
    }
});

export default router;
