require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdmin() {
  const name = "heneel";
  const email = "heneelchhatbar69@gmail.com";
  const password = "Heneeladmin@123";
  const role = "admin";

  console.log(`--- Creating Admin User: ${name} ---`);

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('User already exists. Updating to admin role and updating password...');
      const hashedPassword = await bcrypt.hash(password, 12);
      await prisma.user.update({
        where: { email },
        data: {
          name,
          role,
          passwordHash: hashedPassword
        }
      });
      console.log('✅ Admin user updated successfully.');
    } else {
      console.log('Hashing password...');
      const hashedPassword = await bcrypt.hash(password, 12);
      
      console.log('Creating user in database...');
      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash: hashedPassword,
          role
        }
      });
      console.log('✅ Admin user created successfully:', user.id);
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
