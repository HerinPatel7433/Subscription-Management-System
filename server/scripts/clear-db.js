require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Database Cleanup ---');
  try {
    // Delete in reverse order of dependency
    console.log('Clearing Payments...');
    await prisma.payment.deleteMany();
    
    console.log('Clearing Invoice Lines...');
    await prisma.invoiceLine.deleteMany();
    
    console.log('Clearing Invoices...');
    await prisma.invoice.deleteMany();
    
    console.log('Clearing Subscription Lines...');
    await prisma.subscriptionLine.deleteMany();
    
    console.log('Clearing Subscriptions...');
    await prisma.subscription.deleteMany();
    
    console.log('Clearing Template Lines...');
    await prisma.templateLine.deleteMany();
    
    console.log('Clearing Quotation Templates...');
    await prisma.quotationTemplate.deleteMany();
    
    console.log('Clearing Recurring Plans...');
    await prisma.recurringPlan.deleteMany();
    
    console.log('Clearing Discount Applications...');
    await prisma.discountApplication.deleteMany();
    
    console.log('Clearing Discounts...');
    await prisma.discount.deleteMany();
    
    console.log('Clearing Product Variants...');
    await prisma.productVariant.deleteMany();
    
    console.log('Clearing Taxes...');
    await prisma.tax.deleteMany();
    
    console.log('Clearing Products...');
    await prisma.product.deleteMany();
    
    console.log('Clearing Users...');
    await prisma.user.deleteMany();

    console.log('✅ All database data cleared successfully.');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
