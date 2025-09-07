import type { Role, Visibility } from '@prisma/client'

import { db } from '../db'

export const characterModel = {
    async findUnique(args: {
        where: { id: string }
        select?: {
            ownerId?: boolean
            visibility?: boolean
            owner?: { select: { role: boolean } }
        }
    }): Promise<{ ownerId?: string; visibility?: Visibility; owner?: { role: Role } } | null> {
        const row = db.characters.find(c => c.id === args.where.id) || null
        if (!row) return null
        if (!args.select)
            return {
                ownerId: row.ownerId,
                visibility: row.visibility,
                owner: { role: db.users.find(u => u.id === row.ownerId)?.role || 'USER' },
            }
        const out: Record<string, unknown> = {}
        if (args.select.ownerId) out.ownerId = row.ownerId
        if (args.select.visibility) out.visibility = row.visibility
        if (args.select.owner?.select.role)
            out.owner = { role: db.users.find(u => u.id === row.ownerId)?.role || 'USER' }
        return out as { ownerId?: string; visibility?: Visibility; owner?: { role: Role } }
    },
}
