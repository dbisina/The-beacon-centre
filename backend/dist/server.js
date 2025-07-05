"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const cors_2 = require("./config/cors");
const rateLimiter_1 = require("./middleware/rateLimiter");
const devotional_routes_1 = __importDefault(require("./routes/devotional.routes"));
const videoSermon_routes_1 = __importDefault(require("./routes/videoSermon.routes"));
const audioSermon_routes_1 = __importDefault(require("./routes/audioSermon.routes"));
const announcement_routes_1 = __importDefault(require("./routes/announcement.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const notFound_1 = require("./middleware/notFound");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.set('trust proxy', 1);
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use((0, cors_1.default)(cors_2.corsOptions));
app.use((0, compression_1.default)());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
app.use((0, morgan_1.default)(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Development mode: Rate limiting disabled');
    app.use('/api/', (0, rateLimiter_1.createDevLimiter)());
}
else {
    console.log('🛡️ Production mode: Smart rate limiting enabled');
    app.use('/api/', rateLimiter_1.smartRateLimiter);
}
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'The Beacon Centre API',
        version: '1.0.0',
        environment: process.env.NODE_ENV,
        rateLimit: process.env.NODE_ENV === 'development' ? 'disabled' : 'smart',
        documentation: '/api/docs',
        endpoints: {
            health: '/health',
            devotionals: '/api/devotionals',
            videoSermons: '/api/video-sermons',
            audioSermons: '/api/audio-sermons',
            announcements: '/api/announcements',
            categories: '/api/categories',
            analytics: '/api/analytics',
            admin: '/api/admin',
            upload: '/api/upload',
        },
    });
});
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running!',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: '1.0.0',
    });
});
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'API is healthy!',
        timestamp: new Date().toISOString(),
        services: {
            database: 'connected',
            storage: 'available',
        },
    });
});
app.use('/api/devotionals', devotional_routes_1.default);
app.use('/api/video-sermons', videoSermon_routes_1.default);
app.use('/api/audio-sermons', audioSermon_routes_1.default);
app.use('/api/announcements', announcement_routes_1.default);
app.use('/api/categories', category_routes_1.default);
app.use('/api/analytics', analytics_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/upload', upload_routes_1.default);
app.use(notFound_1.notFound);
app.use(errorHandler_1.errorHandler);
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('👋 SIGINT received. Shutting down gracefully...');
    process.exit(0);
});
const server = app.listen(PORT, () => {
    console.log(`
🚀 The Beacon Centre API Server Started Successfully!

📍 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Server URL: http://localhost:${PORT}
🛡️ Rate Limiting: ${process.env.NODE_ENV === 'development' ? 'Disabled (Dev Mode)' : 'Smart Limiting Enabled'}

📋 Available Endpoints:
   ├── GET  /                    - API Info
   ├── GET  /health              - Health Check
   ├── GET  /api/health          - API Health Check
   ├── GET  /api/devotionals     - List devotionals
   ├── GET  /api/video-sermons   - List video sermons
   ├── GET  /api/audio-sermons   - List audio sermons
   ├── GET  /api/announcements   - List announcements
   ├── GET  /api/categories      - List categories
   ├── POST /api/analytics/track - Track analytics
   └── /api/admin/*              - Admin endpoints (auth required)

💡 Admin Dashboard: Configure to point to this API
📱 Mobile App: Configure to point to this API

${process.env.NODE_ENV === 'development' ?
        '🔧 Development Tips:\n   - Rate limiting is disabled\n   - Detailed error messages enabled\n   - CORS allows all origins' :
        '🏭 Production Mode:\n   - Smart rate limiting active\n   - Error messages sanitized\n   - CORS restricted to allowed origins'}
  `);
});
exports.default = app;
//# sourceMappingURL=server.js.map