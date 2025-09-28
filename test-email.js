const { sendOTPEmail } = require('./src/services/emailService');
require('dotenv').config();

async function testEmail() {
    console.log('🧪 Testing clean email service...');
    console.log('📧 Gmail App Password configured:', !!process.env.GMAIL_APP_PASSWORD);

    if (!process.env.GMAIL_APP_PASSWORD) {
        console.error('❌ GMAIL_APP_PASSWORD environment variable is missing!');
        return;
    }

    const testEmail = process.env.TEST_EMAIL || 'media@jpel.in';
    console.log(`📧 Testing with email: ${testEmail}`);

    try {
        const startTime = Date.now();

        const result = await sendOTPEmail({
            to: testEmail,
            otp: '123456',
            userName: 'Test User'
        });

        const duration = Date.now() - startTime;

        if (result.success) {
            console.log('✅ Email sent successfully!');
            console.log('📧 Message ID:', result.messageId);
            console.log(`⏱️  Duration: ${duration}ms`);
        } else {
            console.error('❌ Email failed:', result.error);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testEmail();
