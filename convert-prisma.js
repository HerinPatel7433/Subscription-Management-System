const fs = require('fs');
let schema = fs.readFileSync('server/prisma/schema.prisma', 'utf-8');

// Switch provider
schema = schema.replace(/provider\s*=\s*"postgresql"/, 'provider = "sqlite"');
schema = schema.replace(/directUrl\s*=\s*env\("DIRECT_URL"\)\n?/, '');

// Convert types
schema = schema.replace(/@db\.\w+(\([^)]*\))?/g, '');
schema = schema.replace(/@default\(dbgenerated\("gen_random_uuid\(\)"\)\)/g, '@default(uuid())');
schema = schema.replace(/Decimal/g, 'Float');

fs.writeFileSync('server/prisma/schema.prisma', schema);
console.log("Prisma schema converted to SQLite.");
