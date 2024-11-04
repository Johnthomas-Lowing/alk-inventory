import mongoose from 'mongoose';

const guardSchema = new mongoose.Schema({
    nameOne: { type: String, required: true },
    nameTwo: { type: String, required: true },
    branch: { type: String, required: true },
    assets: [
        {
            assetName: String,   // You can define further details about the asset if needed
            assetId: mongoose.Schema.Types.ObjectId,  // Optional, if assets are stored in another collection
            checkedOutDate: Date,
        }
    ]
}, { timestamps: true });  // Adds createdAt and updatedAt fields automatically

const Guard = mongoose.model('Guard', guardSchema);

export default Guard;
