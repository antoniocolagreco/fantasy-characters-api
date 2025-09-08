import { PrismaClient } from '@prisma/client'

async function debugCursor() {
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: 'postgresql://fantasy_user:fantasy_password@localhost:5432/fantasy_characters_dev',
            },
        },
    })

    try {
        globalThis.console.log('Testing simple query without cursor...')

        // This is what the failing tests are trying to do
        const result = await prisma.user.findMany({
            where: {
                role: 'ADMIN',
            },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: 21,
        })

        globalThis.console.log('Success! Found', result.length, 'users')
        globalThis.console.log(
            'User IDs:',
            result.map(u => u.id)
        )
    } catch (error) {
        globalThis.console.error('Error:', error.message)
    } finally {
        await prisma.$disconnect()
    }
}

debugCursor()
