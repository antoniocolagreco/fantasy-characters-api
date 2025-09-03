import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
    log: [
        { level: 'warn', emit: 'stdout' },
        { level: 'error', emit: 'stdout' },
    ],
})

export { prisma }
export default prisma
