#!/usr/bin/env node

/**
 * Test script to verify catalogue download tracking
 * Run with: node test-download.js
 */

const mongoose = require('mongoose');
const Catalogue = require('./src/models/Catalogue');
const Download = require('./src/models/Download');

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

const testDownloadTracking = async () => {
    try {
        console.log('\n🔍 Testing Download Tracking...\n');

        // Get all catalogues
        const catalogues = await Catalogue.find({ isActive: true });
        console.log(`📁 Found ${catalogues.length} active catalogues`);

        if (catalogues.length === 0) {
            console.log('❌ No catalogues found. Please upload some catalogues first.');
            return;
        }

        // Get download statistics
        const totalDownloads = await Download.countDocuments();
        console.log(`📊 Total downloads tracked: ${totalDownloads}`);

        // Get recent downloads
        const recentDownloads = await Download.find()
            .populate('userId', 'name email')
            .populate('catalogueId', 'originalName')
            .sort({ timestamp: -1 })
            .limit(5);

        console.log('\n📈 Recent Downloads:');
        recentDownloads.forEach((download, index) => {
            const user = download.userId ? download.userId.name : 'Anonymous';
            const fileName = download.catalogueId ? download.catalogueId.originalName : download.fileName;
            console.log(`${index + 1}. ${fileName} - Downloaded by: ${user} - ${download.timestamp}`);
        });

        // Get catalogue download counts
        console.log('\n📊 Catalogue Download Counts:');
        for (const catalogue of catalogues) {
            const downloadCount = await Download.countDocuments({ catalogueId: catalogue._id });
            console.log(`${catalogue.originalName}: ${catalogue.downloadCount} (DB count: ${downloadCount})`);
        }

        // Check for any discrepancies
        console.log('\n🔍 Checking for discrepancies...');
        let hasDiscrepancies = false;
        for (const catalogue of catalogues) {
            const actualDownloadCount = await Download.countDocuments({ catalogueId: catalogue._id });
            if (catalogue.downloadCount !== actualDownloadCount) {
                console.log(`⚠️  Discrepancy found: ${catalogue.originalName}`);
                console.log(`   Catalogue count: ${catalogue.downloadCount}, Actual downloads: ${actualDownloadCount}`);
                hasDiscrepancies = true;
            }
        }

        if (!hasDiscrepancies) {
            console.log('✅ No discrepancies found - download tracking is working correctly!');
        }

    } catch (error) {
        console.error('❌ Test error:', error);
    }
};

const main = async () => {
    await connectDB();
    await testDownloadTracking();
    await mongoose.connection.close();
    console.log('\n✅ Test completed');
};

main().catch(console.error);
