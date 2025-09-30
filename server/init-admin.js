const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

async function initializeAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/eventgenie');
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ username: 'admin' });
        
        if (existingAdmin) {
            console.log('ℹ️ Admin user already exists');
            return;
        }

        // Create default admin user
        const admin = new Admin({
            username: 'admin',
            password: 'admin@123'
        });

        await admin.save();
        console.log('✅ Default admin user created successfully');
        console.log('Username: admin');
        console.log('Password: admin@123');

    } catch (error) {
        console.error('❌ Error initializing admin:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

initializeAdmin(); 