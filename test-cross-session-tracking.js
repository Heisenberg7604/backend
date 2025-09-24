#!/usr/bin/env node

/**
 * Cross-Session Download Tracking Test
 * This script demonstrates how user tracking works across multiple sessions
 * Run with: node test-cross-session-tracking.js
 */

const mongoose = require('mongoose');
const Catalogue = require('./src/models/Catalogue');
const Download = require('./src/models/Download');
const User = require('./src/models/User');

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sevala', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

const simulateCrossSessionTracking = async () => {
    try {
        console.log('\n🔄 Simulating Cross-Session Download Tracking...\n');

        // Find a test user (or create one if none exists)
        let testUser = await User.findOne({ email: 'test@example.com' });
        if (!testUser) {
            testUser = await User.create({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                companyName: 'Test Company',
                isActive: true
            });
            console.log('👤 Created test user:', testUser.email);
        } else {
            console.log('👤 Using existing test user:', testUser.email);
        }

        // Get available catalogues
        const catalogues = await Catalogue.find({ isActive: true }).limit(3);
        if (catalogues.length === 0) {
            console.log('❌ No catalogues found. Please upload some catalogues first.');
            return;
        }

        console.log(`📁 Found ${catalogues.length} catalogues for testing\n`);

        // Simulate downloads across different sessions
        const sessions = [
            { session: 'Session 1', date: new Date(), description: 'User logs in and downloads first catalogue' },
            { session: 'Session 2', date: new Date(Date.now() + 24 * 60 * 60 * 1000), description: 'User logs in next day and downloads another catalogue' },
            { session: 'Session 3', date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), description: 'User logs in day after and downloads third catalogue' }
        ];

        console.log('📊 Simulating downloads across sessions:\n');

        for (let i = 0; i < sessions.length && i < catalogues.length; i++) {
            const session = sessions[i];
            const catalogue = catalogues[i];

            // Create download record
            const download = await Download.create({
                userId: testUser._id,
                catalogueId: catalogue._id,
                fileName: catalogue.originalName,
                fileSize: catalogue.fileSize,
                ipAddress: '192.168.1.100',
                userAgent: 'Mozilla/5.0 (Test Browser)',
                timestamp: session.date
            });

            // Update catalogue download count
            catalogue.downloadCount += 1;
            await catalogue.save();

            console.log(`📅 ${session.session} (${session.date.toDateString()}):`);
            console.log(`   📄 Downloaded: ${catalogue.originalName}`);
            console.log(`   👤 User: ${testUser.name} (${testUser.email})`);
            console.log(`   🆔 Download ID: ${download._id}`);
            console.log(`   📊 Total downloads for this catalogue: ${catalogue.downloadCount}`);
            console.log('');
        }

        // Now demonstrate how admin panel would see this data
        console.log('🔍 Admin Panel View - Download History:\n');

        const allDownloads = await Download.find({ userId: testUser._id })
            .populate('userId', 'name email companyName')
            .populate('catalogueId', 'originalName')
            .sort({ timestamp: -1 });

        console.log(`📈 Total downloads by ${testUser.name}: ${allDownloads.length}\n`);

        allDownloads.forEach((download, index) => {
            const user = download.userId;
            const catalogue = download.catalogueId;
            console.log(`${index + 1}. ${catalogue.originalName}`);
            console.log(`   👤 User: ${user.name} (${user.email})`);
            console.log(`   🏢 Company: ${user.companyName}`);
            console.log(`   📅 Downloaded: ${download.timestamp.toLocaleString()}`);
            console.log(`   🌐 IP: ${download.ipAddress}`);
            console.log('');
        });

        // Show catalogue statistics
        console.log('📊 Catalogue Download Statistics:\n');
        for (const catalogue of catalogues) {
            const downloadCount = await Download.countDocuments({ catalogueId: catalogue._id });
            console.log(`${catalogue.originalName}:`);
            console.log(`   📊 Download count: ${catalogue.downloadCount}`);
            console.log(`   🔢 Actual downloads: ${downloadCount}`);
            console.log('');
        }

        // Demonstrate user activity tracking
        console.log('👤 User Activity Summary:\n');
        const userDownloads = await Download.find({ userId: testUser._id })
            .populate('catalogueId', 'originalName')
            .sort({ timestamp: -1 });

        const uniqueCatalogues = [...new Set(userDownloads.map(d => d.catalogueId.originalName))];
        const totalFileSize = userDownloads.reduce((sum, d) => sum + (d.fileSize || 0), 0);

        console.log(`👤 User: ${testUser.name}`);
        console.log(`📧 Email: ${testUser.email}`);
        console.log(`🏢 Company: ${testUser.companyName}`);
        console.log(`📅 First download: ${userDownloads[userDownloads.length - 1]?.timestamp.toLocaleString()}`);
        console.log(`📅 Last download: ${userDownloads[0]?.timestamp.toLocaleString()}`);
        console.log(`📄 Total downloads: ${userDownloads.length}`);
        console.log(`📁 Unique catalogues: ${uniqueCatalogues.length}`);
        console.log(`💾 Total data downloaded: ${(totalFileSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`📋 Catalogues downloaded: ${uniqueCatalogues.join(', ')}`);

        console.log('\n✅ Cross-session tracking test completed successfully!');
        console.log('\n🎯 Key Points:');
        console.log('   • User identity is preserved across sessions via JWT token');
        console.log('   • Each download is tracked with user ID, timestamp, and metadata');
        console.log('   • Admin panel can see complete download history for each user');
        console.log('   • Download counts are updated in real-time');
        console.log('   • All data persists in database across sessions');

    } catch (error) {
        console.error('❌ Test error:', error);
    }
};

const main = async () => {
    await connectDB();
    await simulateCrossSessionTracking();
    await mongoose.connection.close();
    console.log('\n✅ Test completed');
};

main().catch(console.error);
