"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient({
    log: ['info', 'query'],
});
const bcrypt = require("bcrypt");
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
    }
    else {
        console.log('⚠️ Super Admin already exists.');
    }
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed-admin.js.map