const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting OPTIMIZED programmatic mock data seeding (historical)...');

  // CLEANUP existing mock data to allow a clean run
  // CLEANUP existing mock data in correct order
  const mockSubs = await prisma.subscription.findMany({ 
    where: { subscriptionNumber: { startsWith: 'MOCK-' } },
    select: { id: true }
  });
  const subIds = mockSubs.map(s => s.id);

  if (subIds.length > 0) {
    await prisma.payment.deleteMany({ where: { invoice: { subscriptionId: { in: subIds } } } });
    await prisma.invoiceLine.deleteMany({ where: { invoice: { subscriptionId: { in: subIds } } } });
    await prisma.invoice.deleteMany({ where: { subscriptionId: { in: subIds } } });
    await prisma.subscriptionLine.deleteMany({ where: { subscriptionId: { in: subIds } } });
    await prisma.subscription.deleteMany({ where: { id: { in: subIds } } });
  }
  console.log(`🧹 Cleaned up ${subIds.length} previous mock subscriptions.`);

  // 1. Get or Create Admin reference
  let admin = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (!admin) {
    const passwordHash = await bcrypt.hash('Password@123', 10);
    admin = await prisma.user.create({
      data: {
        name: 'Seed Admin',
        email: 'seed.admin@sms.dev',
        passwordHash,
        role: 'admin',
      },
    });
  }

  // 2. Define Products
  const productData = [
    { name: 'Cloud Storage 100GB', type: 'digital', salesPrice: 499, costPrice: 200 },
    { name: 'Cloud Storage 500GB', type: 'digital', salesPrice: 1499, costPrice: 600 },
    { name: 'Premium Support', type: 'service', salesPrice: 2999, costPrice: 1200 },
    { name: 'SaaS Dashboard Pro', type: 'digital', salesPrice: 1999, costPrice: 800 },
    { name: 'API Access Tier 1', type: 'digital', salesPrice: 999, costPrice: 300 },
    { name: 'Onboarding Workshop', type: 'service', salesPrice: 4999, costPrice: 2500 },
    { name: 'Analytics Add-on', type: 'digital', salesPrice: 799, costPrice: 300 },
    { name: 'Security Audit', type: 'service', salesPrice: 8999, costPrice: 4000 },
    { name: 'Custom Integration', type: 'service', salesPrice: 15000, costPrice: 7000 },
    { name: 'Email Marketing Tool', type: 'digital', salesPrice: 1299, costPrice: 500 },
  ];

  const products = [];
  for (const p of productData) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (existing) {
      products.push(existing);
    } else {
      const product = await prisma.product.create({ data: { ...p, createdById: admin.id } });
      products.push(product);
    }
  }

  // 3. Plans
  const planData = [
    { name: 'Growth Monthly', price: 999, billingPeriod: 'monthly' },
    { name: 'Growth Yearly', price: 9999, billingPeriod: 'yearly' },
    { name: 'Enterprise Monthly', price: 4999, billingPeriod: 'monthly' },
    { name: 'Enterprise Yearly', price: 49999, billingPeriod: 'yearly' },
  ];
  const plans = [];
  for (const p of planData) {
    const existing = await prisma.recurringPlan.findFirst({ where: { name: p.name } });
    if (existing) {
      plans.push(existing);
    } else {
      const plan = await prisma.recurringPlan.create({ data: p });
      plans.push(plan);
    }
  }

  // 4. Portal Users
  const passwordHash = await bcrypt.hash('Password@123', 10);
  const customers = [];
  for (let i = 1; i <= 20; i++) {
    const email = `customer${i}@example.com`;
    let customer = await prisma.user.findUnique({ where: { email } });
    if (!customer) {
      customer = await prisma.user.create({
        data: { name: `Customer ${i}`, email, passwordHash, role: 'portal' },
      });
    }
    customers.push(customer);
  }

  // 5. Generate 400 Subscriptions with historical dates
  console.log('⏳ Generating 400 historical subscriptions with relational data (optimized)...');
  
  const statuses = ['active', 'closed', 'cancelled'];
  const now = new Date();
  const threeYearsAgo = new Date(now.getFullYear() - 3, 0, 1);

  for (let i = 1; i <= 400; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const plan = plans[Math.floor(Math.random() * plans.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    const startDate = new Date(threeYearsAgo.getTime() + Math.random() * (now.getTime() - threeYearsAgo.getTime()));
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    let expirationDate = null;
    if (status !== 'active') {
      expirationDate = new Date(startDate.getTime());
      expirationDate.setMonth(expirationDate.getMonth() + Math.floor(Math.random() * 12) + 1);
    }

    // Creating subscription and its invoices in a faster sequence
    const sub = await prisma.subscription.create({
      data: {
        subscriptionNumber: `MOCK-${i.toString().padStart(4, '0')}`,
        customerId: customer.id,
        planId: plan.id,
        startDate,
        expirationDate,
        status,
        lines: {
          create: [{
            productId: product.id,
            quantity: 1,
            unitPrice: product.salesPrice,
            amount: product.salesPrice,
          }]
        }
      }
    });

    // Bulk create invoices for this subscription
    const invoicesToCreate = [];
    let invoiceDate = new Date(startDate);
    const limitDate = expirationDate && expirationDate < now ? expirationDate : now;

    while (invoiceDate < limitDate) {
      invoicesToCreate.push({
        subscriptionId: sub.id,
        customerId: customer.id,
        status: Math.random() > 0.1 ? 'paid' : 'overdue',
        issuedDate: new Date(invoiceDate),
        dueDate: new Date(invoiceDate.getTime() + 15 * 24 * 60 * 60 * 1000),
        totalAmount: product.salesPrice,
      });

      if (plan.billingPeriod === 'monthly') {
        invoiceDate.setMonth(invoiceDate.getMonth() + 1);
      } else {
        invoiceDate.setFullYear(invoiceDate.getFullYear() + 1);
      }
      
      if (invoiceDate > now) break;
      if (invoicesToCreate.length > 40) break; // Safety limit
    }

    // Since we need IDs for line items and payments, individually create or use a trick.
    // For mock data, we'll individually create but in a small loop to keep it manageable.
    for (const invData of invoicesToCreate) {
      const invoice = await prisma.invoice.create({
        data: {
          ...invData,
          lines: {
            create: [{
              productId: product.id,
              quantity: 1,
              unitPrice: product.salesPrice,
              lineTotal: product.salesPrice,
            }]
          }
        }
      });

      if (invoice.status === 'paid') {
        await prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            paymentMethod: 'credit_card',
            amount: invoice.totalAmount,
            paymentDate: new Date(invoice.issuedDate.getTime() + 5 * 24 * 60 * 60 * 1000),
            notes: 'Mock billing cycle',
          }
        });
      }
    }

    if (i % 50 === 0) console.log(`   ... processed ${i}/400 subscriptions`);
  }

  console.log('✅ SEEDING COMPLETE!');
}

main()
  .catch((e) => {
    console.error('❌ SEED ERROR:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
