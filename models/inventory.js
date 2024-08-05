import mongoose from 'mongoose';

const inventorySchema = mongoose.Schema({
    name: String,
    color: String,
    size: String,
    quantity: Number,
    price: Number,
    location: String,
    created_at: {
        type: Date,
        default: Date.now
    }
});

const Inventory = mongoose.model('Inventory', inventorySchema);

export default Inventory;