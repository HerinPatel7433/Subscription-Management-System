require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const invoices = await prisma.invoice.findMany({
    where: { deletedAt: null },
    include: { customer: { select: { name: true, role: true } } },
    orderBy: { issuedDate: 'desc' },
  });

  console.log(`Total invoices: ${invoices.length}`);
  invoices.forEach(inv => {
    console.log(`  ID: ${inv.id.slice(0, 8)} | Status: ${inv.status} | Customer: ${inv.customer?.name} (${inv.customer?.role}) | Amount: ${inv.totalAmount}`);
  });

  // Specifically list confirmed ones
  const confirmed = invoices.filter(i => i.status === 'confirmed');
  console.log(`\nConfirmed invoices (payable): ${confirmed.length}`);
  if (confirmed.length > 0) {
    console.log('  First confirmed ID:', confirmed[0].id);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
