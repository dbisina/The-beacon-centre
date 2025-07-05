"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDatabaseConfigured = exports.prisma = void 0;
const client_1 = require("@prisma/client");
let prisma;
const isDatabaseConfigured = process.env.DATABASE_URL && process.env.DATABASE_URL !== '';
exports.isDatabaseConfigured = isDatabaseConfigured;
try {
    if (isDatabaseConfigured) {
        exports.prisma = prisma = new client_1.PrismaClient({
            log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
        });
        console.log('📊 Database: Prisma Client initialized');
    }
    else {
        console.log('⚠️  Database: No DATABASE_URL provided - running without database');
        exports.prisma = prisma = {};
    }
}
catch (error) {
    console.error('❌ Failed to initialize Prisma Client:', error);
    console.log('⚠️  Running without database connection');
    exports.prisma = prisma = {};
}
//# sourceMappingURL=database.js.map