import type { RefreshToken } from '@prisma/client'

import { db } from '../db'
import type { DeleteManyResult, UpdateManyResult } from '../types'
import { now, PrismaLikeError } from '../utils'

export const refreshTokenModel = {
    async deleteMany(args?: {
        where?: {
            OR?: Array<{ expiresAt?: { lt?: Date }; isRevoked?: boolean }>
            userId?: { in?: string[] }
        }
    }): Promise<DeleteManyResult> {
        if (!args?.where) {
            const count = db.tokens.length
            db.tokens.length = 0
            return { count }
        }
        const before = db.tokens.length
        const idSet = args.where.userId?.in ? new Set(args.where.userId.in) : undefined
        for (let i = db.tokens.length - 1; i >= 0; i--) {
            const t = db.tokens[i]
            if (!t) continue
            let match = false
            if (idSet && idSet.has(t.userId)) match = true
            if (args.where.OR && args.where.OR.length > 0) {
                const orMatch = args.where.OR.some(cond => {
                    if (cond.expiresAt?.lt && t.expiresAt < cond.expiresAt.lt) return true
                    if (cond.isRevoked !== undefined && t.isRevoked === cond.isRevoked) return true
                    return false
                })
                match = match || orMatch
            }
            if (match) db.tokens.splice(i, 1)
        }
        return { count: before - db.tokens.length }
    },

    async create(args: { data: RefreshToken }): Promise<RefreshToken> {
        const existsByToken = db.tokens.some(t => t.token === args.data.token)
        if (existsByToken) throw new PrismaLikeError('P2002', { target: ['token'] })
        db.tokens.push(args.data)
        return args.data
    },

    async findFirst(args: {
        where: { token: string; isRevoked: boolean; expiresAt: { gt: Date } }
    }): Promise<RefreshToken | null> {
        const { token } = args.where
        const ts = now()
        return db.tokens.find(t => t.token === token && !t.isRevoked && t.expiresAt > ts) || null
    },

    async updateMany(args: {
        where: { token?: string; userId?: string; isRevoked: boolean }
        data: { isRevoked: boolean }
    }): Promise<UpdateManyResult> {
        let count = 0
        for (const t of db.tokens) {
            const tokenMatch = args.where.token ? t.token === args.where.token : true
            const userMatch = args.where.userId ? t.userId === args.where.userId : true
            if (tokenMatch && userMatch && !t.isRevoked) {
                t.isRevoked = args.data.isRevoked
                t.updatedAt = now()
                count++
            }
        }
        return { count }
    },

    async findMany(args: {
        where: { userId: string; isRevoked: boolean; expiresAt: { gt: Date } }
        orderBy?: { createdAt: 'asc' | 'desc' }
    }): Promise<RefreshToken[]> {
        const ts = now()
        const list = db.tokens.filter(
            t => t.userId === args.where.userId && !t.isRevoked && t.expiresAt > ts
        )
        const order = args.orderBy?.createdAt || 'desc'
        list.sort((a, b) =>
            order === 'asc'
                ? a.createdAt.getTime() - b.createdAt.getTime()
                : b.createdAt.getTime() - a.createdAt.getTime()
        )
        return list
    },
}
