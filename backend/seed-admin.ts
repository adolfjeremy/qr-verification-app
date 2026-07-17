import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

import * as bcrypt from 'bcrypt';

async function main() {
  const adminEmail = 'jeremy@pixby.id';
  const adminPassword = await bcrypt.hash('Polmed123!', 10);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: adminEmail,
        password_hash: adminPassword,
        role: 'SUPER_ADMIN',
      }
    });
    console.log('✅ Default Super Admin created successfully!');
  } else {
    console.log('⚠️ Super Admin already exists.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
