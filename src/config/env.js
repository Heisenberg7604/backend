import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];

requiredEnvVars.forEach((name) => {
    if (!process.env[name]) {
        console.error(`❌ Missing required environment variable: ${name}`);
        process.exit(1);
    }
});

const config = {
    jwt: {
        secret: process.env.JWT_SECRET,
        accessExpire: process.env.JWT_ACCESS_EXPIRE || '1h',
    },
    env: process.env.NODE_ENV || 'development',
};

export default config;