// server/prisma/seed.js
// Runs the seed SQL file statement-by-statement via Prisma.
// Handles multi-row INSERTs correctly by splitting only on semicolons
// that end a full statement (not those inside string literals).

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

/**
 * Split a SQL file into individual statements, correctly handling:
 * - single-quoted strings (won't split on ; inside them)
 * - single-line (--) comments
 * - BEGIN / COMMIT wrappers
 */
function splitSqlStatements(sql) {
  const stmts = [];
  let current = '';
  let inSingleQuote = false;
  let i = 0;

  while (i < sql.length) {
    const ch = sql[i];
    const next = sql[i + 1];

    // Toggle single-quote state (handle escaped '' inside strings)
    if (ch === "'" && !inSingleQuote) {
      inSingleQuote = true;
      current += ch;
      i++;
      continue;
    }
    if (ch === "'" && inSingleQuote) {
      current += ch;
      i++;
      // Escaped quote ''
      if (sql[i] === "'") {
        current += sql[i];
        i++;
      } else {
        inSingleQuote = false;
      }
      continue;
    }

    // Skip single-line comments (only outside strings)
    if (!inSingleQuote && ch === '-' && next === '-') {
      while (i < sql.length && sql[i] !== '\n') i++;
      continue;
    }

    // Statement boundary
    if (!inSingleQuote && ch === ';') {
      const trimmed = current.trim();
      if (trimmed && !['BEGIN', 'COMMIT'].includes(trimmed.toUpperCase())) {
        stmts.push(trimmed);
      }
      current = '';
      i++;
      continue;
    }

    current += ch;
    i++;
  }

  // Catch any trailing statement without a semicolon
  const trimmed = current.trim();
  if (trimmed && !['BEGIN', 'COMMIT'].includes(trimmed.toUpperCase())) {
    stmts.push(trimmed);
  }

  return stmts;
}

async function main() {
  console.log('🌱 Starting database seed...');

  const sqlPath = path.join(__dirname, '../../database/seeds/seed.sql');

  if (!fs.existsSync(sqlPath)) {
    console.error('❌ Seed file not found at:', sqlPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  const statements = splitSqlStatements(sql);

  console.log(`   Found ${statements.length} SQL statements to execute...`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log(`   ✓ Statement ${i + 1}/${statements.length}`);
    } catch (err) {
      const pgCode = err?.meta?.code ?? '';
      // 23505 = unique_violation — safe to skip on re-runs
      if (pgCode === '23505') {
        console.warn(`   ⚠️  Statement ${i + 1}: duplicate — skipped`);
      } else {
        console.error(`   ❌ Statement ${i + 1} failed (PG ${pgCode}):`);
        console.error('   ', stmt.slice(0, 200));
        throw err;
      }
    }
  }

  console.log('');
  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('  Demo credentials (all passwords → Password@123)');
  console.log('  ─────────────────────────────────────────────────');
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
