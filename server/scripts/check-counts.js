require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany();
  const plans = await prisma.recurringPlan.findMany();
  const subscriptions = await prisma.subscription.findMany();
  
  console.log(`Found ${products.length} Products, ${plans.length} Plans, ${subscriptions.length} Subscriptions.`);
  console.log('Products:', products.map(p => p.name).join(', '));
  console.log('Plans:', plans.map(p => p.name).join(', '));
  console.log('Subscriptions:', subscriptions.map(s => s.subscriptionNumber).join(', '));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
