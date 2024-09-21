import express from 'express';
import Item from '../models/Item.js'; // Ensure this path is correct

const router = express.Router();

// Route to get items based on query parameters or all items if no parameters are provided
router.get('/items', async (req, res) => {
  try {
    const { name, size, color, location } = req.query;

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
      res.status(404).json({ message: 'Item not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
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



export default router;
