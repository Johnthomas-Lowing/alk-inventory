import express from 'express';
import Inventory from '../models/inventory.js';
import { isAuthenticated } from '../middleware/auth.js'; // Import middleware

const router = express.Router();

<<<<<<< Updated upstream
// Function to convert strings to Title Case
function toTitleCase(str) {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

// DELETE request to wipe the entire inventory collection
router.delete('/wipe', async (req, res) => {
    try {
        await Inventory.deleteMany({});
        res.json({ message: 'Inventory wiped successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to wipe inventory' });
    }
});

// GET request to retrieve all inventory items (no location filter)
router.get('/', async (req, res) => {
    try {
        const items = await Inventory.find();
        res.json(items);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to retrieve inventory' });
    }
});

// POST request to check out items from the inventory
router.post('/checkout', async (req, res) => {
    const { cartItems, employeeName } = req.body;

    if (!employeeName) {
        return res.status(400).json({ error: 'Employee name is required for checkout' });
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
        return res.status(400).json({ error: 'Cart items are required' });
    }

    try {
        for (const cartItem of cartItems) {
            const { _id, quantity } = cartItem;
            if (!_id || typeof quantity !== 'number' || quantity <= 0) {
                return res.status(400).json({ error: 'Invalid cart item data' });
            }

            const item = await Inventory.findById(_id);
            if (!item) {
                console.error(`Item with ID ${_id} not found.`);
                return res.status(404).json({ error: 'Item not found' });
            }

            if (quantity > item.quantity) {
                return res.status(400).json({ error: `Insufficient stock for item ${item.name}` });
            }

            item.quantity -= quantity;
            await item.save();
        }

        console.log('Items checked out successfully');
        res.status(200).json({ message: 'Items checked out successfully' });
    } catch (error) {
        console.error('Error checking out items:', error);
        res.status(500).json({ error: 'Failed to check out items' });
    }
});

router.post('/checkin', async (req, res) => {
    const { cartItems } = req.body;

    console.log('Received Request Body:', req.body);

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
        return res.status(400).json({ error: 'Cart items are required' });
    }

    try {
        for (const cartItem of cartItems) {
            const { _id, quantity, price } = cartItem;

            // Detailed logging of cart item data
            console.log('Processing Cart Item:', { _id, quantity, price });

            // Validate cart item data
            if (!_id || typeof quantity !== 'number' || quantity <= 0) {
                console.error('Invalid cart item data:', cartItem);
                return res.status(400).json({ error: 'Invalid cart item data', item: cartItem });
            }

            // Check if price is valid
            if (typeof price !== 'number' || price <= 0) {
                console.error('Invalid price data:', cartItem);
                return res.status(400).json({ error: 'Price must be greater than 0', item: cartItem });
            }

            const item = await Inventory.findById(_id);
            if (!item) {
                console.error(`Item with ID ${_id} not found.`);
                return res.status(404).json({ error: 'Item not found' });
            }

            // Calculate the new average price
            const currentTotalPrice = item.quantity * item.price;
            const newTotalPrice = quantity * price;
            const totalPrice = currentTotalPrice + newTotalPrice;
            const totalQuantity = item.quantity + quantity;
            const newAveragePrice = totalPrice / totalQuantity;

            console.log(`Current Total Price: ${currentTotalPrice}`);
            console.log(`New Total Price: ${newTotalPrice}`);
            console.log(`Total Price: ${totalPrice}`);
            console.log(`Total Quantity: ${totalQuantity}`);
            console.log(`New Average Price: ${newAveragePrice}`);

            // Update the item's quantity and price
            item.quantity = totalQuantity;
            item.price = newAveragePrice;

            console.log(`Updated item data: ${JSON.stringify(item)}`);

            await item.save();

            console.log(`Item saved: ${JSON.stringify(item)}`);
        }

        console.log('Items checked in successfully');
        res.status(200).json({ message: 'Items checked in successfully' });
    } catch (error) {
        console.error('Error checking in items:', error);
        res.status(500).json({ error: 'Failed to check in items' });
    }
});

router.post('/add', isAuthenticated, async (req, res) => {
    const { name, location, color, size, quantity, price } = req.body;

    // Validate the input
    if (!name || !location) {
        return res.status(400).json({ message: 'Name and Location fields are required' });
    }

    // Sanitize inputs
    const sanitizedItems = {
        name: toTitleCase(name),
        color: color ? toTitleCase(color) : '-',
        size: size ? toTitleCase(size) : '-',
        quantity: quantity ? quantity : 0,
        price: price ? price : 0,
        location: toTitleCase(location)
    };

    // Check if the item already exists
    const existingItem = await Inventory.findOne({ 
        name: sanitizedItems.name, 
        color: sanitizedItems.color, 
        size: sanitizedItems.size,
        location: sanitizedItems.location
    });

    if (existingItem) {
        return res.status(400).json({ message: 'Item already exists' });
    }

    const newItem = new Inventory(sanitizedItems);

    try {
        const savedItem = await newItem.save();
        res.status(201).json(savedItem);
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: 'Failed to save inventory item' });
    }
});

// POST request to delete multiple inventory items by IDs
router.post('/delete', async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'No IDs provided for deletion' });
    }

    try {
        const result = await Inventory.deleteMany({ _id: { $in: ids } });
        res.json({ message: 'Items deleted successfully', result });
    } catch (err) {
        console.error('Error deleting items:', err);
        res.status(500).json({ message: 'Failed to delete items' });
    }
});


// GET request to filter items by various criteria
router.get('/filter', async (req, res) => {
    const { name, color, size, location, quantity } = req.query;
    let filter = {};

    if (name) filter.name = new RegExp(toTitleCase(name), 'i'); // Case-insensitive search
    if (color) filter.color = new RegExp(toTitleCase(color), 'i');
    if (size) filter.size = new RegExp(toTitleCase(size), 'i');
    if (location) filter.location = new RegExp(toTitleCase(location), 'i');
    if (quantity) filter.quantity = quantity;

    try {
        const items = await Inventory.find(filter);
        res.json(items);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to filter inventory' });
=======
router.get('/items', async (req, res) => {
  try {
    const { name, size, color, location, id } = req.query;

    // If an id is provided, fetch the item by id
    if (id) {
      const item = await Item.findById(id);
      if (item) {
        return res.json(item);  // Return the single item
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
>>>>>>> Stashed changes
    }
});

<<<<<<< Updated upstream
// GET request to read inventory item by ID
router.get('/:id', async (req, res) => {
    try {
        const item = await Inventory.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json(item);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to retrieve inventory item' });
=======


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
>>>>>>> Stashed changes
    }
});

// DELETE request to delete inventory item by ID
router.delete('/:id', async (req, res) => {
    try {
        const item = await Inventory.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        // Report creation should be handled in a separate process
        res.json({ message: `Item with ID ${req.params.id} deleted successfully` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to delete inventory item' });
    }
});

// PATCH request to adjust item names, colors, sizes.
router.patch('/:id', async (req, res) => {
    const itemId = req.params.id;
    const { name, color, size } = req.body;

    try {
        const item = await Inventory.findById(itemId);

        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        // Update fields if provided in the request body
        if (name) item.name = name;
        if (color) item.color = color;
        if (size) item.size = size;

        await item.save();
        res.status(200).json(item);
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ error: 'Server error' });
    }
});


export default router;
