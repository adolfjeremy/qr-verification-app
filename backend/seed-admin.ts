import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = 'jeremy@pixby.id';
  const adminPassword = await bcrypt.hash('Polmed123', 10);

  const upsertAdmin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password_hash: adminPassword,
      role: 'SUPER_ADMIN',
    },
    create: {
      name: 'Super Admin',
      email: adminEmail,
      password_hash: adminPassword,
      role: 'SUPER_ADMIN',
    }
  });

  console.log('✅ Super Admin credentials have been forcefully set/updated!');
  console.log('Email:', adminEmail);
  console.log('Password:', adminPassword);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
