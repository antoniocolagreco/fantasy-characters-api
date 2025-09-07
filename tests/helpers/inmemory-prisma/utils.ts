export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
}

export function now(): Date {
    return new Date()
}

export function compareValues(a: unknown, b: unknown): number {
    if (a === b) return 0
    if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime()
    if (typeof a === 'number' && typeof b === 'number') return a - b
    const sa = String(a)
    const sb = String(b)
    if (sa === sb) return 0
    return sa > sb ? 1 : -1
}

export class PrismaLikeError extends Error {
    code: string
    meta?: unknown
    constructor(code: string, meta?: unknown) {
        super(code)
        this.code = code
        this.meta = meta
    }
}
