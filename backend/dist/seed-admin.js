"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    await prisma.user.updateMany({
        data: { role: 'SUPER_ADMIN' }
    });
    console.log('All users updated to SUPER_ADMIN');
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed-admin.js.map