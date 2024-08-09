import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    // Add more fields as needed
});

const Employee = mongoose.model('Employee', employeeSchema);

export default Employee;
