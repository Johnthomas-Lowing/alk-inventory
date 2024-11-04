import express from 'express';
import Guard from '../models/guard.js';  // Adjust the path based on your project structure

const router = express.Router();

// Create a new guard
router.post('/add', async (req, res) => {
    const { nameOne, nameTwo, branch, assets } = req.body;
    
    try {
        const newGuard = new Guard({
            nameOne,
            nameTwo,
            branch,
            assets
        });

        await newGuard.save();
        res.status(201).json({ message: 'Guard created successfully', guard: newGuard });
    } catch (error) {
        res.status(500).json({ message: 'Error creating guard', error: error.message });
    }
});
// Bulk create guards
router.post('/bulk-add', async (req, res) => {
    const guards = req.body;  // Expecting an array of guard objects

    // Validate that the request body contains an array
    if (!Array.isArray(guards)) {
        return res.status(400).json({ message: 'Request body must be an array of guards' });
    }

    try {
        // Use insertMany to add multiple guards at once
        const newGuards = await Guard.insertMany(guards);
        res.status(201).json({ message: 'Guards created successfully', guards: newGuards });
    } catch (error) {
        res.status(500).json({ message: 'Error creating guards', error: error.message });
    }
});


// Get all guards
router.get('/', async (req, res) => {
    try {
        const guards = await Guard.find();
        res.status(200).json(guards);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving guards', error: error.message });
    }
});

// Get a single guard by ID
router.get('/:id', async (req, res) => {
    try {
        const guard = await Guard.findById(req.params.id);
        if (!guard) {
            return res.status(404).json({ message: 'Guard not found' });
        }
        res.status(200).json(guard);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving guard', error: error.message });
    }
});

// Update a guard by ID
router.put('/:id', async (req, res) => {
    const { nameOne, nameTwo, branch, assets } = req.body;
    
    try {
        const updatedGuard = await Guard.findByIdAndUpdate(
            req.params.id,
            { nameOne, nameTwo, branch, assets },
            { new: true }  // This option returns the updated document
        );

        if (!updatedGuard) {
            return res.status(404).json({ message: 'Guard not found' });
        }

        res.status(200).json({ message: 'Guard updated successfully', guard: updatedGuard });
    } catch (error) {
        res.status(500).json({ message: 'Error updating guard', error: error.message });
    }
});

// Delete a guard by ID
router.delete('/:id', async (req, res) => {
    try {
        const deletedGuard = await Guard.findByIdAndDelete(req.params.id);

        if (!deletedGuard) {
            return res.status(404).json({ message: 'Guard not found' });
        }

        res.status(200).json({ message: 'Guard deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting guard', error: error.message });
    }
});

// Add an asset to a guard's assets array
router.patch('/:id/assets/add', async (req, res) => {
    const { assetId, quantity } = req.body;  // The asset ID and quantity to transfer

    try {
        // Fetch the asset from the asset tracking DB
        const asset = await Asset.findById(assetId);  // Assuming you have an Asset model
        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        // Ensure there's enough quantity at the current location
        if (asset.quantity < quantity) {
            return res.status(400).json({ message: 'Not enough quantity available' });
        }

        // Find the guard
        const guard = await Guard.findById(req.params.id);
        if (!guard) {
            return res.status(404).json({ message: 'Guard not found' });
        }

        // Deduct the quantity from the asset at the current location
        asset.quantity -= quantity;
        await asset.save();

        // Check if the guard already has this asset, update quantity if so
        const existingAsset = guard.assets.find(a => a.assetId === assetId);
        if (existingAsset) {
            existingAsset.quantity += quantity;
        } else {
            // Add the asset to the guard's assets
            guard.assets.push({ assetId, quantity });
        }

        await guard.save();
        res.status(200).json({ message: 'Asset transferred successfully', guard });
    } catch (error) {
        res.status(500).json({ message: 'Error transferring asset', error: error.message });
    }
});


// Remove an asset from a guard's assets array
router.patch('/:id/assets/remove', async (req, res) => {
    const { assetId, quantity } = req.body;  // The asset ID and quantity to return

    try {
        // Fetch the asset from the asset tracking DB
        const asset = await Asset.findById(assetId);
        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        // Find the guard
        const guard = await Guard.findById(req.params.id);
        if (!guard) {
            return res.status(404).json({ message: 'Guard not found' });
        }

        // Find the asset in the guard's list
        const existingAsset = guard.assets.find(a => a.assetId === assetId);
        if (!existingAsset || existingAsset.quantity < quantity) {
            return res.status(400).json({ message: 'Not enough quantity to remove' });
        }

        // Deduct the quantity from the guard's assets
        existingAsset.quantity -= quantity;
        if (existingAsset.quantity === 0) {
            // Remove the asset if the quantity reaches zero
            guard.assets = guard.assets.filter(a => a.assetId !== assetId);
        }

        // Add the quantity back to the asset at the current location
        asset.quantity += quantity;
        await asset.save();

        await guard.save();
        res.status(200).json({ message: 'Asset returned successfully', guard });
    } catch (error) {
        res.status(500).json({ message: 'Error returning asset', error: error.message });
    }
});


export default router;
