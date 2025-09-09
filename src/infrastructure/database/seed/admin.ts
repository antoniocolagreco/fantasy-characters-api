import { type PrismaClient, type Role, Role as RoleEnum } from '@prisma/client'

import { passwordService } from '@/features/auth/password.service'
import { generateUUIDv7 } from '@/shared/utils'

export async function seedAdminUser(prisma: PrismaClient) {
    const passwordHash = await passwordService.hashPassword('admin123')
    const user = await prisma.user.create({
        data: {
            id: generateUUIDv7(),
            email: 'admin@admin.dev',
            passwordHash,
            name: 'admin',
            role: RoleEnum.USER,
            isEmailVerified: true,
            isActive: true,
        },
    })
    await prisma.user.update({ where: { id: user.id }, data: { role: RoleEnum.ADMIN } })
    return { ...user, role: RoleEnum.ADMIN as Role }
}
