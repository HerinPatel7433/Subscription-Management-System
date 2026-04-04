// server/prisma/seed.js
// Prisma-compatible seed script — reads the raw SQL seed file and executes it.
// Run with: npx prisma db seed   OR   npm run prisma:seed

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const sqlPath = path.join(__dirname, '../../database/seeds/seed.sql');

  if (!fs.existsSync(sqlPath)) {
    console.error('❌ Seed file not found at:', sqlPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Split on statement boundaries so we can run each statement individually.
  // Strip single-line comments to avoid false positives.
  const cleaned = sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');

  // Execute the whole block as a single raw query (BEGIN/COMMIT are included).
  await prisma.$executeRawUnsafe(cleaned);

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('  Demo credentials (all passwords: Password@123)');
  console.log('  ─────────────────────────────────────────────');
  console.log('  admin    → alice.admin@sms.dev');
  console.log('  internal → bob.internal@sms.dev');
  console.log('  portal   → carol.portal@sms.dev');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
