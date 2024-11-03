import mongoose from 'mongoose';

const { Schema } = mongoose;

// Define the Item Schema
const itemSchema = new Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  size: { type: String, required: true },  
  color: { type: String, required: true }, 
  quantity: { type: Number, required: true },
  assignment: {type: String, required: true},
  cost : { type: Number, required: true },
  created_at: {
        type: Date,
        default: Date.now
    } 
});

// Create the model from the schema
const Item = mongoose.model('Item', itemSchema);

export default Item; // Use export default for ES modules
