const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

const createAdminUser = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jpapp');
        console.log('✅ Connected to MongoDB');

        // Check if admin user already exists
        const existingAdmin = await User.findOne({ email: 'admin@jpgroup.com' });
        
        if (existingAdmin) {
            console.log('✅ Admin user already exists');
            console.log('Admin Details:', {
                email: existingAdmin.email,
                name: existingAdmin.name,
                role: existingAdmin.role,
                isActive: existingAdmin.isActive
            });
        } else {
            // Create admin user
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

            await adminUser.save();
            console.log('✅ Admin user created successfully');
            console.log('Admin Details:', {
                email: adminUser.email,
                name: adminUser.name,
                role: adminUser.role,
                isActive: adminUser.isActive
            });
        }

        // Also create a secondary admin for testing
        const secondaryAdmin = await User.findOne({ email: 'darshan@jpgroup.com' });
        
        if (!secondaryAdmin) {
            const secondaryAdminUser = new User({
                name: 'Darshan Dorik',
                email: 'darshan@jpgroup.com',
                password: 'darshan123',
                companyName: 'JP Group Industries',
                phoneNumber: '+91-9876543211',
                city: 'Mumbai',
                role: 'admin',
                isActive: true,
                emailVerified: true
            });

            await secondaryAdminUser.save();
            console.log('✅ Secondary admin user created successfully');
        }

        console.log('\n🎉 Admin setup complete!');
        console.log('\n📋 Admin Credentials:');
        console.log('Primary Admin:');
        console.log('  Email: admin@jpgroup.com');
        console.log('  Password: admin123');
        console.log('\nSecondary Admin:');
        console.log('  Email: darshan@jpgroup.com');
        console.log('  Password: darshan123');
        console.log('\n🔗 Login URL: http://localhost:3001/api/auth/login');

    } catch (error) {
        console.error('❌ Error creating admin user:', error);
    } finally {
        await mongoose.disconnect();
        console.log('📡 Disconnected from MongoDB');
    }
};

createAdminUser();
