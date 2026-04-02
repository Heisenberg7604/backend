import cors from "cors";

const allowedOrigins = {
    development: [
        "http://localhost:8081",
        "http://localhost:19006",
        "http://localhost:3000",
        "http://127.0.0.1:8081",
        "http://127.0.0.1:19006"
    ],
    staging: [
        "https://staging.jpgroup.industries"
    ],
    production: [
        "https://jpgroup.industries",
        "https://www.jpgroup.industries"
    ]
};

const environment = process.env.NODE_ENV || "development";

const corsOptions = {
    origin: function (origin, callback) {

        // allow mobile apps / curl requests with no origin
        if (!origin) {
            return callback(null, true);
        }

        const allowed = allowedOrigins[environment] || [];

        if (allowed.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("CORS not allowed for this origin: " + origin));
        }
    },
    credentials: true
};

export default cors(corsOptions);