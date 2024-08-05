import mongoose from 'mongoose';

const reportItemSchema = new mongoose.Schema({
    name: String,
    color: String,
    size: String,
    quantity: Number,
    price: Number,
    location: String,
});

const reportSchema = new mongoose.Schema({
    username: String,
    action: String,
    items: [reportItemSchema],
    totalPrice: Number,
    employeeName: String, // Ensure employeeName is included in the schema
    created_at: {
        type: Date,
        default: Date.now
    }
});

const Report = mongoose.model('Report', reportSchema);

export default Report;