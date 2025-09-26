const { sendOTPEmail } = require('./src/services/emailService');
require('dotenv').config();

async function testEmail() {
    console.log('🧪 Testing email service with improved configuration...');
    console.log('📧 Gmail App Password configured:', !!process.env.GMAIL_APP_PASSWORD);
    console.log('🌐 Environment:', process.env.NODE_ENV || 'development');

    if (!process.env.GMAIL_APP_PASSWORD) {
        console.error('❌ GMAIL_APP_PASSWORD environment variable is missing!');
        console.log('Please set GMAIL_APP_PASSWORD in your environment variables.');
        return;
    }

    // Test with a real email address
    const testEmail = process.env.TEST_EMAIL || 'info@jpel.in';
    console.log(`📧 Testing with email: ${testEmail}`);

    try {
        console.log('🚀 Starting email test...');
        const startTime = Date.now();

        const result = await sendOTPEmail({
            to: testEmail,
            otp: '123456',
            userName: 'Test User'
        });

        const endTime = Date.now();
        const duration = endTime - startTime;

        if (result.success) {
            console.log('✅ Email test successful!');
            console.log('📧 Message ID:', result.messageId);
            console.log(`⏱️  Duration: ${duration}ms`);
        } else {
            console.error('❌ Email test failed:', result.error);
        }
    } catch (error) {
        console.error('❌ Email test error:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Test multiple times to check reliability
async function runMultipleTests() {
    console.log('🔄 Running multiple email tests to check reliability...\n');

    for (let i = 1; i <= 3; i++) {
        console.log(`--- Test ${i}/3 ---`);
        await testEmail();
        console.log(''); // Empty line for readability

        if (i < 3) {
            console.log('⏳ Waiting 5 seconds before next test...');
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    console.log('🏁 All tests completed!');
}

// Run the tests
runMultipleTests();
