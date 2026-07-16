import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.updateMany({
    data: { role: 'SUPER_ADMIN' }
  });
  console.log('All users updated to SUPER_ADMIN');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
