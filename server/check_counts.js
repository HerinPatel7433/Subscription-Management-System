const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const c = await prisma.subscription.count();
  const i = await prisma.invoice.count();
  const p = await prisma.payment.count();
  console.log({ subscriptions: c, invoices: i, payments: p });
  await prisma.$disconnect();
}
run();
