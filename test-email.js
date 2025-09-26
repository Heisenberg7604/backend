const { sendOTPEmail } = require('./src/services/emailService');
require('dotenv').config();

async function testEmail() {
    console.log('🧪 Testing email service...');
    console.log('📧 Gmail App Password configured:', !!process.env.GMAIL_APP_PASSWORD);

    if (!process.env.GMAIL_APP_PASSWORD) {
        console.error('❌ GMAIL_APP_PASSWORD environment variable is missing!');
        console.log('Please set GMAIL_APP_PASSWORD in your environment variables.');
        return;
    }

    try {
        const result = await sendOTPEmail({
            to: 'test@example.com', // Replace with your test email
            otp: '123456',
            userName: 'Test User'
        });

        if (result.success) {
            console.log('✅ Email test successful!');
            console.log('📧 Message ID:', result.messageId);
        } else {
            console.error('❌ Email test failed:', result.error);
        }
    } catch (error) {
        console.error('❌ Email test error:', error.message);
    }
}

testEmail();
