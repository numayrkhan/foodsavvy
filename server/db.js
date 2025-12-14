const { PrismaClient } = require('./generated/client'); // Points to your generated folder
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// 1. Create the connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 2. Create the adapter
const adapter = new PrismaPg(pool);

// 3. Initialize the single global Prisma Client instance
const prisma = new PrismaClient({ adapter });

module.exports = prisma;