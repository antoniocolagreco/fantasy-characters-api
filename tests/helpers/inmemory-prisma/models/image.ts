import type { Image, Visibility } from '@prisma/client'

import { db } from '../db'
import type { CountResult, ImageWhereInput, OrderBy } from '../types'
import { compareValues, isRecord, now, PrismaLikeError } from '../utils'

export const imageModel = {
    async deleteMany() {
        const count = db.images.length
        db.images.length = 0
        return { count }
    },

    async create(args: { data: Record<string, unknown> & { id: string } }): Promise<Image> {
        const ts = now()
        let ownerId: string | null = null
        const { ownerId: ownerIdField } = args.data
        if (typeof ownerIdField === 'string') ownerId = ownerIdField
        else if (
            isRecord(args.data.owner) &&
            isRecord(args.data.owner.connect) &&
            typeof args.data.owner.connect.id === 'string'
        )
            ownerId = args.data.owner.connect.id

        const image: Image = {
            id: args.data.id,
            blob: (() => {
                const b = args.data.blob
                if (b instanceof Uint8Array) return Buffer.from(b)
                if (b instanceof Buffer) return b
                return Buffer.from('fake-image-data')
            })(),
            description: typeof args.data.description === 'string' ? args.data.description : null,
            size: typeof args.data.size === 'number' ? args.data.size : 1024,
            mimeType: typeof args.data.mimeType === 'string' ? args.data.mimeType : 'image/webp',
            width: typeof args.data.width === 'number' ? args.data.width : 100,
            height: typeof args.data.height === 'number' ? args.data.height : 100,
            ownerId,
            visibility: (args.data.visibility as Visibility | undefined) ?? 'PUBLIC',
            createdAt: ts,
            updatedAt: ts,
        }
        db.images.push(image)
        return image
    },

    async findUnique(args: {
        where: { id: string }
        select?: {
            id?: boolean
            blob?: boolean
            description?: boolean
            size?: boolean
            mimeType?: boolean
            width?: boolean
            height?: boolean
            ownerId?: boolean
            visibility?: boolean
            createdAt?: boolean
            updatedAt?: boolean
        }
    }): Promise<Partial<Image> | null> {
        const image = db.images.find(img => img.id === args.where.id) || null
        if (!image) return null
        if (!args.select) return image
        const out: Partial<Image> = {}
        if (args.select.id) out.id = image.id
        if (args.select.blob) out.blob = image.blob
        if (args.select.description) out.description = image.description
        if (args.select.size) out.size = image.size
        if (args.select.mimeType) out.mimeType = image.mimeType
        if (args.select.width) out.width = image.width
        if (args.select.height) out.height = image.height
        if (args.select.ownerId) out.ownerId = image.ownerId
        if (args.select.visibility) out.visibility = image.visibility
        if (args.select.createdAt) out.createdAt = image.createdAt
        if (args.select.updatedAt) out.updatedAt = image.updatedAt
        return out
    },

    async findMany(args: {
        where?: ImageWhereInput
        orderBy?: OrderBy
        take?: number
        select?: {
            id?: boolean
            description?: boolean
            size?: boolean
            mimeType?: boolean
            width?: boolean
            height?: boolean
            ownerId?: boolean
            visibility?: boolean
            createdAt?: boolean
            updatedAt?: boolean
        }
    }): Promise<Partial<Image>[]> {
        let list = db.images.slice()
        const { where } = args
        if (where) {
            if (where.id) list = list.filter(img => img.id === where.id)
            if (where.ownerId !== undefined)
                list = list.filter(img => img.ownerId === where.ownerId)
            if (where.visibility) list = list.filter(img => img.visibility === where.visibility)
            if (where.mimeType) list = list.filter(img => img.mimeType === where.mimeType)
            if (where.width?.gte !== undefined)
                list = list.filter(img => img.width >= (where.width?.gte || 0))
            if (where.width?.lte !== undefined)
                list = list.filter(img => img.width <= (where.width?.lte || 0))
            if (where.height?.gte !== undefined)
                list = list.filter(img => img.height >= (where.height?.gte || 0))
            if (where.height?.lte !== undefined)
                list = list.filter(img => img.height <= (where.height?.lte || 0))
            if (where.description?.contains) {
                const search = where.description.contains.toLowerCase()
                list = list.filter(img => img.description?.toLowerCase().includes(search))
            }
            if (where.OR && where.OR.length > 0) {
                list = list.filter(img => {
                    return (
                        where.OR?.some(cond => {
                            const entries = Object.entries(cond)
                            return entries.every(([key, val]) => {
                                if (key === 'createdAt' && isRecord(val) && 'lt' in val) {
                                    return img.createdAt < (val.lt as Date)
                                }
                                if (key === 'id' && isRecord(val) && 'lt' in val) {
                                    return img.id < (val.lt as string)
                                }
                                return false
                            })
                        }) || false
                    )
                })
            }
        }

        let order: OrderBy = args.orderBy ? [...args.orderBy] : []
        if (order.length === 1) {
            const first = order[0]
            if (first && !Object.prototype.hasOwnProperty.call(first, 'id')) {
                const values = Object.values(first)
                const firstVal = values.length > 0 ? values[0] : 'desc'
                const dir: 'asc' | 'desc' = firstVal === 'asc' ? 'asc' : 'desc'
                order = [...order, { id: dir }]
            }
        }
        for (const o of [...order].reverse()) {
            const entries = Object.entries(o)
            if (entries.length === 0) continue
            const [key, dir] = entries[0] as [string, 'asc' | 'desc']
            list.sort((a, b) => {
                const av = (a as Record<string, unknown>)[key]
                const bv = (b as Record<string, unknown>)[key]
                const cmp = compareValues(av, bv)
                return dir === 'asc' ? cmp : -1 * cmp
            })
        }

        if (args.take !== undefined) list = list.slice(0, args.take)
        if (!args.select) return list
        return list.map(image => {
            const out: Partial<Image> = {}
            if (args.select?.id) out.id = image.id
            if (args.select?.description) out.description = image.description
            if (args.select?.size) out.size = image.size
            if (args.select?.mimeType) out.mimeType = image.mimeType
            if (args.select?.width) out.width = image.width
            if (args.select?.height) out.height = image.height
            if (args.select?.ownerId) out.ownerId = image.ownerId
            if (args.select?.visibility) out.visibility = image.visibility
            if (args.select?.createdAt) out.createdAt = image.createdAt
            if (args.select?.updatedAt) out.updatedAt = image.updatedAt
            return out
        })
    },

    async update(args: { where: { id: string }; data: Partial<Image> }): Promise<Image> {
        const idx = db.images.findIndex(img => img.id === args.where.id)
        if (idx === -1) throw new PrismaLikeError('P2025')
        const current = db.images[idx]
        if (!current) throw new PrismaLikeError('P2025')
        const ts = now()
        const updated: Image = {
            ...current,
            ...args.data,
            id: current.id,
            createdAt: current.createdAt,
            updatedAt: ts,
        }
        db.images[idx] = updated
        return updated
    },

    async delete(args: { where: { id: string } }): Promise<Image> {
        const idx = db.images.findIndex(img => img.id === args.where.id)
        if (idx === -1) throw new PrismaLikeError('P2025')
        const removed = db.images.splice(idx, 1)[0]
        if (!removed) throw new PrismaLikeError('P2025')
        return removed
    },

    async count(args?: { where?: ImageWhereInput }): Promise<CountResult> {
        if (!args?.where) return db.images.length
        const rows = await this.findMany({ where: args.where })
        return rows.length
    },

    async groupBy(args: {
        by: Array<'visibility' | 'mimeType'>
        where?: ImageWhereInput
        _count: boolean
    }): Promise<Array<{ visibility?: Visibility; mimeType?: string; _count: number }>> {
        const filtered = args.where
            ? ((await this.findMany({ where: args.where })) as Image[])
            : db.images
        const groups: Record<
            string,
            { visibility?: Visibility; mimeType?: string; _count: number }
        > = {}
        for (const image of filtered) {
            const key = args.by.map(field => image[field]).join('|')
            if (!groups[key]) {
                groups[key] = { _count: 0 }
                if (args.by.includes('visibility')) groups[key].visibility = image.visibility
                if (args.by.includes('mimeType')) groups[key].mimeType = image.mimeType
            }
            groups[key]._count++
        }
        return Object.values(groups)
    },

    async aggregate(args: {
        where?: ImageWhereInput
        _sum: { size: boolean }
        _avg: { size: boolean; width: boolean; height: boolean }
    }): Promise<{
        _sum: { size: number | null }
        _avg: { size: number | null; width: number | null; height: number | null }
    }> {
        const filtered = args.where
            ? ((await this.findMany({ where: args.where })) as Image[])
            : db.images
        if (filtered.length === 0)
            return { _sum: { size: null }, _avg: { size: null, width: null, height: null } }
        const totalSize = filtered.reduce((sum, img) => sum + img.size, 0)
        const totalWidth = filtered.reduce((sum, img) => sum + img.width, 0)
        const totalHeight = filtered.reduce((sum, img) => sum + img.height, 0)
        return {
            _sum: { size: totalSize },
            _avg: {
                size: totalSize / filtered.length,
                width: totalWidth / filtered.length,
                height: totalHeight / filtered.length,
            },
        }
    },
}
