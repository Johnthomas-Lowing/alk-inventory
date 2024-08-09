import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
     username: {
        type: String,
        required: true,
        unique: true
      },
      password: {
        type: String,
        required: true
      },
      role: {
        type: String,
        enum: ['admin', 'user'], // Example roles
        default: 'user'
      }
});

// Method to hash the password before saving the user
userSchema.pre('save', async function(next) {
    if (this.isModified('password') || this.isNew) {
        try {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
            next();
        } catch (err) {
            next(err);
        }
    } else {
        return next();
    }
});

// Method to verify the password
userSchema.methods.verifyPassword = async function(password) {
    try {
        return await bcrypt.compare(password, this.password);
    } catch (err) {
        throw new Error('Error comparing passwords');
    }
};

const User = mongoose.model('User', userSchema);

export default User;
