const nodemailer = require('nodemailer');
const logActivity = require('../utils/logActivity');

// Create Gmail SMTP transporter with fallback
const createTransporter = (usePort465 = true) => {
    const config = {
        service: 'gmail',
        host: 'smtp.gmail.com',
        auth: {
            user: 'media.jpel@gmail.com',
            pass: process.env.GMAIL_APP_PASSWORD
        },
        tls: {
            rejectUnauthorized: false
        },
        connectionTimeout: 30000, // 30 seconds
        greetingTimeout: 15000,   // 15 seconds
        socketTimeout: 30000,     // 30 seconds
        pool: false, // Disable pooling for better reliability
        maxConnections: 1,
        maxMessages: 1
    };

    if (usePort465) {
        // Try port 465 (SSL) first
        config.port = 465;
        config.secure = true;
    } else {
        // Fallback to port 587 (TLS)
        config.port = 587;
        config.secure = false;
    }

    return nodemailer.createTransport(config);
};

// Send email function with retry logic and port fallback
const sendEmail = async ({ to, subject, html, text, from = 'media.jpel@gmail.com' }, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            // Try port 465 first, then fallback to 587
            const usePort465 = attempt <= 2;
            const transporter = createTransporter(usePort465);
            const portInfo = usePort465 ? '465 (SSL)' : '587 (TLS)';

            const mailOptions = {
                from: from,
                to: Array.isArray(to) ? to.join(', ') : to,
                subject: subject,
                html: html,
                text: text
            };

            console.log(`📧 Attempting to send email (attempt ${attempt}/${retries}) on port ${portInfo}...`);
            const result = await transporter.sendMail(mailOptions);
            console.log('✅ Email sent successfully:', result.messageId);

            // Close the transporter
            transporter.close();

            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error(`❌ Email sending error (attempt ${attempt}/${retries}):`, error.message);

            if (attempt === retries) {
                console.error('❌ All email attempts failed');
                return { success: false, error: error.message };
            }

            // Wait before retry (exponential backoff)
            const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
            console.log(`⏳ Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
};

// Send notification emails to admin emails
const sendNotificationEmail = async ({ subject, message, type = 'notification', data = {} }) => {
    const adminEmails = [
        'info@jpel.in',
        'rakesh@jpel.in'
    ];

    const html = `
        <div style="font-family: Arial, sans-serif; border: 2px dashed #000; padding: 20px; max-width: 600px; margin: auto;">
            <!-- Logo -->
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://jpel.in/static/media/footer-logo.6cd7aaadced76bd27f40.jpg" alt="JP Group Logo" style="max-width: 400px;">
            </div>
            
            <h2 style="text-align: center; font-size: 24px; margin-bottom: 20px;">${subject}</h2>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                <p style="margin-bottom: 10px; font-size: 16px;">${message}</p>
            </div>
            
            ${data.userName ? `<p><strong>User:</strong> ${data.userName}</p>` : ''}
            ${data.userEmail ? `<p><strong>Email:</strong> ${data.userEmail}</p>` : ''}
            ${data.companyName ? `<p><strong>Company:</strong> ${data.companyName}</p>` : ''}
            ${data.city ? `<p><strong>City:</strong> ${data.city}</p>` : ''}
            ${data.ipAddress ? `<p><strong>IP Address:</strong> ${data.ipAddress}</p>` : ''}
            ${data.timestamp ? `<p><strong>Time:</strong> ${new Date(data.timestamp).toLocaleString()}</p>` : ''}
            
            <p style="margin-top: 30px; font-size: 12px; color: #666;">
                This is an automated notification from JP Extrusiontech Private Limited.
            </p>
        </div>
    `;

    return await sendEmail({
        to: adminEmails,
        subject: `[JP Admin] ${subject}`,
        html: html
    });
};

// Send password reset email
const sendPasswordResetEmail = async ({ to, resetUrl, userName }) => {
    const html = `
        <div style="font-family: Arial, sans-serif; border: 2px dashed #000; padding: 20px; max-width: 600px; margin: auto;">
            <!-- Logo -->
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://jpel.in/static/media/footer-logo.6cd7aaadced76bd27f40.jpg" alt="JP Group Logo" style="max-width: 400px;">
            </div>
            
            <h2 style="text-align: center; font-size: 24px; margin-bottom: 20px;">Password Reset Request</h2>
            
            <p style="margin-bottom: 15px;">Dear ${userName},</p>
            
            <p style="margin-bottom: 15px;">You have requested to reset your password for your JP Group account.</p>
            
            <p style="margin-bottom: 15px;">Click the button below to reset your password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </div>
            
            <p style="margin-bottom: 15px;">Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666; margin-bottom: 15px;">${resetUrl}</p>
            
            <p style="margin-bottom: 15px;"><strong>This link will expire in 10 minutes.</strong></p>
            
            <p style="margin-bottom: 15px;">If you didn't request this password reset, please ignore this email.</p>
            
            <p style="margin-bottom: 5px;">Regards,</p>
            <p style="margin-bottom: 5px; font-weight: bold;">J P Extrusiontech Private Limited</p>
            
            <p style="margin-top: 30px; font-size: 12px; color: #666;">This is an auto generated email. PLEASE DO NOT REPLY directly to this email.</p>
        </div>
    `;

    return await sendEmail({
        to: to,
        subject: 'Password Reset Request - JP Group',
        html: html,
        from: 'media.jpel@gmail.com'
    });
};

module.exports = {
    sendEmail,
    sendNotificationEmail,
    sendPasswordResetEmail
};
