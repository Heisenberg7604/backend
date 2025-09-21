const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

const recreateAdminUsers = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jpapp');
        console.log('✅ Connected to MongoDB');

        // Delete existing admin users
        await User.deleteMany({
            email: { $in: ['admin@jpgroup.com', 'darshan@jpgroup.com'] }
        });
        console.log('🗑️ Deleted existing admin users');

        // Create new admin users with proper password hashing
        const adminUser = new User({
            name: 'JP Group Admin',
            email: 'admin@jpgroup.com',
            password: 'admin123', // This will be hashed by the model
            companyName: 'JP Group Industries',
            phoneNumber: '+91-9876543210',
            city: 'Mumbai',
            role: 'admin',
            isActive: true,
            emailVerified: true
        });

        const secondaryAdminUser = new User({
            name: 'Darshan Dorik',
            email: 'darshan@jpgroup.com',
            password: 'darshan123', // This will be hashed by the model
            companyName: 'JP Group Industries',
            phoneNumber: '+91-9876543211',
            city: 'Mumbai',
            role: 'admin',
            isActive: true,
            emailVerified: true
        });

        await adminUser.save();
        await secondaryAdminUser.save();

        console.log('✅ Admin users recreated successfully');
        console.log('\n📋 Admin Credentials:');
        console.log('Primary Admin:');
        console.log('  Email: admin@jpgroup.com');
        console.log('  Password: admin123');
        console.log('\nSecondary Admin:');
        console.log('  Email: darshan@jpgroup.com');
        console.log('  Password: darshan123');

    } catch (error) {
        console.error('❌ Error recreating admin users:', error);
    } finally {
        await mongoose.disconnect();
        console.log('📡 Disconnected from MongoDB');
    }
};

recreateAdminUsers();
