const nodemailer = require('nodemailer');
const logActivity = require('../utils/logActivity');
const fs = require('fs');
const path = require('path');

// Create Gmail SMTP transporter with production-ready configuration
const createTransporter = () => {
    if (!process.env.GMAIL_APP_PASSWORD) {
        throw new Error('GMAIL_APP_PASSWORD environment variable is required');
    }

    const config = {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: 'media.jpel@gmail.com',
            pass: process.env.GMAIL_APP_PASSWORD
        },
        // Production-optimized settings
        connectionTimeout: 30000, // 30 seconds
        greetingTimeout: 15000,   // 15 seconds
        socketTimeout: 30000,     // 30 seconds
        pool: false,              // Disable pooling for production stability
        maxConnections: 1,        // Single connection for stability
        maxMessages: 10,         // Reduced for production stability
        rateLimit: 1,            // Conservative rate limit
        tls: {
            rejectUnauthorized: false,
            ciphers: 'SSLv3'
        },
        // Additional production settings
        requireTLS: true,
        debug: false,            // Disable debug in production
        logger: false,           // Disable logger in production
        // Connection retry settings
        retryDelay: 2000,
        maxRetries: 2
    };

    return nodemailer.createTransport(config);
};

// Send email function (simplified like jpel2)
const sendEmail = async ({ to, subject, html, text, from = 'media.jpel@gmail.com' }) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: from,
            to: Array.isArray(to) ? to.join(', ') : to,
            subject: subject,
            html: html,
            text: text
        };

        console.log('📧 Sending email...');
        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', result.messageId);

        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('❌ Email sending error:', error);

        // Provide more specific error messages
        let errorMessage = error.message;
        if (error.code === 'EAUTH') {
            errorMessage = 'Email authentication failed. Please check Gmail app password.';
        } else if (error.code === 'ECONNECTION') {
            errorMessage = 'Failed to connect to email server.';
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Email server connection timed out.';
        }

        return { success: false, error: errorMessage };
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


// Send catalogue email with PDF attachments
const sendCatalogueEmail = async ({ to, productTitle, catalogues, userName, userEmail }) => {
    try {
        const transporter = createTransporter();

        const html = `
            <div style="font-family: Arial, sans-serif; border: 2px dashed #000; padding: 20px; max-width: 600px; margin: auto;">
                <!-- Logo -->
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="https://jpel.in/static/media/footer-logo.6cd7aaadced76bd27f40.jpg" alt="JP Group Logo" style="max-width: 400px;">
                </div>
                
                <h2 style="text-align: center; font-size: 24px; margin-bottom: 20px;">📧 Your Requested Catalogues</h2>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                    <p style="margin-bottom: 10px; font-size: 16px;">Dear ${userName},</p>
                    <p style="margin-bottom: 10px; font-size: 16px;">Thank you for your interest in our ${productTitle} products!</p>
                    <p style="margin-bottom: 10px; font-size: 16px;">Please find the requested catalogues attached to this email.</p>
                </div>
                
                <div style="background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                    <h3 style="margin-top: 0; color: #1976d2;">📋 Attached Catalogues:</h3>
                    <ul style="margin: 0; padding-left: 20px;">
                        ${catalogues.map(cat => `<li style="margin-bottom: 5px;">${cat.originalName}</li>`).join('')}
                    </ul>
                </div>
                
                <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                    <h3 style="margin-top: 0; color: #856404;">💡 Next Steps:</h3>
                    <ul style="margin: 0; padding-left: 20px;">
                        <li style="margin-bottom: 5px;">Review the attached catalogues</li>
                        <li style="margin-bottom: 5px;">Contact us for technical specifications</li>
                        <li style="margin-bottom: 5px;">Request a quote or consultation</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://jpel.in/contact" style="background-color: #E53E3E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Contact Us</a>
                </div>
                
                <p style="margin-top: 30px; font-size: 12px; color: #666;">
                    This email was sent from JP Extrusiontech Private Limited.<br>
                    If you have any questions, please contact us at info@jpel.in
                </p>
            </div>
        `;

        // Prepare attachments
        const attachments = [];
        for (const catalogue of catalogues) {
            if (fs.existsSync(catalogue.filePath)) {
                attachments.push({
                    filename: catalogue.originalName,
                    path: catalogue.filePath,
                    contentType: 'application/pdf'
                });
            } else {
                console.warn(`⚠️ File not found: ${catalogue.filePath}`);
            }
        }

        if (attachments.length === 0) {
            throw new Error('No catalogue files found to attach');
        }

        const mailOptions = {
            from: 'media.jpel@gmail.com',
            to: to,
            subject: `JP Group Catalogues: ${productTitle} (${attachments.length} files)`,
            html: html,
            attachments: attachments
        };

        console.log('📧 Sending catalogue email...');
        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Catalogue email sent successfully:', result.messageId);

        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('❌ Catalogue email sending error:', error);

        // Provide more specific error messages
        let errorMessage = error.message;
        if (error.code === 'EAUTH') {
            errorMessage = 'Email authentication failed. Please check Gmail app password.';
        } else if (error.code === 'ECONNECTION') {
            errorMessage = 'Failed to connect to email server.';
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Email server connection timed out.';
        }

        return { success: false, error: errorMessage };
    }
};

// Send OTP email for password reset
const sendOTPEmail = async ({ to, otp, userName }) => {
    const html = `
        <div style="font-family: Arial, sans-serif; border: 2px dashed #000; padding: 20px; max-width: 600px; margin: auto;">
            <!-- Logo -->
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://jpel.in/static/media/footer-logo.6cd7aaadced76bd27f40.jpg" alt="JP Group Logo" style="max-width: 200px; height: auto; display: block; margin: 0 auto;">
            </div>
            
            <h2 style="text-align: center; font-size: 24px; margin-bottom: 20px;">Password Reset OTP</h2>
            
            <p style="margin-bottom: 15px;">Dear ${userName},</p>
            
            <p style="margin-bottom: 15px;">You have requested to reset your password for your JP Group account.</p>
            
            <p style="margin-bottom: 15px;">Please use the following OTP (One-Time Password) to verify your identity:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <div style="background-color: #f8f9fa; border: 2px solid #007bff; border-radius: 10px; padding: 20px; display: inline-block;">
                    <h1 style="margin: 0; font-size: 36px; color: #007bff; letter-spacing: 5px; font-family: 'Courier New', monospace;">${otp}</h1>
                </div>
            </div>
            
            <p style="margin-bottom: 15px;"><strong>This OTP will expire in 5 minutes.</strong></p>
            
            <p style="margin-bottom: 15px;">Enter this OTP in the app to proceed with password reset.</p>
            
            <p style="margin-bottom: 15px;">If you didn't request this password reset, please ignore this email.</p>
            
            <p style="margin-bottom: 5px;">Regards,</p>
            <p style="margin-bottom: 5px; font-weight: bold;">J P Extrusiontech Private Limited</p>
            
            <p style="margin-top: 30px; font-size: 12px; color: #666;">This is an auto generated email. PLEASE DO NOT REPLY directly to this email.</p>
        </div>
    `;

    return await sendEmail({
        to: to,
        subject: 'Password Reset OTP - JP Group',
        html: html,
        from: 'media.jpel@gmail.com'
    });
};

module.exports = {
    sendEmail,
    sendNotificationEmail,
    sendCatalogueEmail,
    sendOTPEmail
};

// Verify transporter on startup with production-ready error handling
const testTransporter = createTransporter();
testTransporter.verify((error) => {
    if (error) {
        console.error('❌ SMTP transporter verification failed:', error.message);
        console.log('⚠️  Email service will retry on first use');
    } else {
        console.log('✅ SMTP transporter is ready to send emails');
    }
});

// Graceful shutdown for production
process.on('SIGTERM', () => {
    if (testTransporter) {
        testTransporter.close();
    }
});

process.on('SIGINT', () => {
    if (testTransporter) {
        testTransporter.close();
    }
});
