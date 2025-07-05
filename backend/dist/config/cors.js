"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simpleCorsOptions = exports.corsOptions = void 0;
const developmentOrigins = [
    'http://localhost:3000',
    'http://localhost:19006',
    'http://localhost:8081',
    'exp://localhost:19000',
    'exp://192.168.1.100:19000',
    'http://192.168.1.100:19006',
];
const productionOrigins = [
    'https://beacon-admin-sigma.vercel.app',
    'https://beacon-admin-sigma.vercel.app/',
    'https://your-production-domain.com',
];
const envOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : [];
const allowedOrigins = [
    ...developmentOrigins,
    ...(process.env.NODE_ENV === 'production' ? productionOrigins : []),
    ...envOrigins,
];
exports.corsOptions = {
    origin: (origin, callback) => {
        console.log(`🌐 CORS: Request from origin: ${origin}`);
        console.log(`🌐 CORS: Allowed origins:`, allowedOrigins);
        if (!origin) {
            console.log(`✅ CORS: Allowing request with no origin`);
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
            console.log(`✅ CORS: Origin ${origin} is in allowed list`);
            return callback(null, true);
        }
        if (process.env.NODE_ENV === 'development') {
            if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
                console.log(`✅ CORS: Allowing localhost origin: ${origin}`);
                return callback(null, true);
            }
            if (/^https?:\/\/192\.168\.\d+\.\d+/.test(origin)) {
                console.log(`✅ CORS: Allowing local network origin: ${origin}`);
                return callback(null, true);
            }
            if (origin.startsWith('exp://')) {
                console.log(`✅ CORS: Allowing Expo origin: ${origin}`);
                return callback(null, true);
            }
        }
        console.log(`🚫 CORS: Rejected origin: ${origin}`);
        if (process.env.NODE_ENV === 'production') {
            console.log(`⚠️ CORS: Temporarily allowing rejected origin: ${origin} (production debug mode)`);
            return callback(null, true);
        }
        callback(new Error(`CORS: Origin ${origin} not allowed`), false);
    },
    credentials: true,
    methods: [
        'GET',
        'POST',
        'PUT',
        'PATCH',
        'DELETE',
        'OPTIONS',
        'HEAD'
    ],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control',
        'X-Device-Platform',
        'X-App-Version',
        'X-Device-ID',
    ],
    exposedHeaders: [
        'X-Total-Count',
        'X-Rate-Limit-Limit',
        'X-Rate-Limit-Remaining',
        'X-Rate-Limit-Reset',
    ],
    optionsSuccessStatus: 200,
    maxAge: 86400,
};
if (process.env.NODE_ENV === 'development') {
    console.log('🌐 CORS: Allowed origins:', allowedOrigins);
}
exports.simpleCorsOptions = {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control',
        'X-Device-Platform',
        'X-App-Version',
        'X-Device-ID',
    ],
    exposedHeaders: [
        'X-Total-Count',
        'X-Rate-Limit-Limit',
        'X-Rate-Limit-Remaining',
        'X-Rate-Limit-Reset',
    ],
    optionsSuccessStatus: 200,
    maxAge: 86400,
};
//# sourceMappingURL=cors.js.map