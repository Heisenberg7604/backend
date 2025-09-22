require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

async function seedAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: process.env.ADMIN_SEED_EMAIL || 'admin@jpapp.com' });
        if (existingAdmin) {
            console.log('⚠️  Admin user already exists:', existingAdmin.email);
            console.log('   Email:', existingAdmin.email);
            console.log('   Role:', existingAdmin.role);
            console.log('   Active:', existingAdmin.isActive);
            process.exit(0);
        }

        // Create admin user
        const salt = await bcrypt.genSalt(Number(process.env.BCRYPT_SALT || 10));
        const passwordHash = await bcrypt.hash(process.env.ADMIN_SEED_PASSWORD || 'jpeljaiko1854#', salt);

        const admin = await User.create({
            name: 'JP Admin',
            email: process.env.ADMIN_SEED_EMAIL || 'admin@jpapp.com',
            password: passwordHash,
            companyName: 'JP Extrusiontech',
            phoneNumber: '+91-9876543210',
            city: 'Mumbai',
            role: 'admin',
            isActive: true,
            emailVerified: true
        });

        console.log('✅ Admin user created successfully!');
        console.log('   Email:', admin.email);
        console.log('   Password:', process.env.ADMIN_SEED_PASSWORD || 'jpeljaiko1854#');
        console.log('   Role:', admin.role);
        console.log('   ID:', admin._id);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
        process.exit(1);
    }
}

// Run the seed function
seedAdmin();
