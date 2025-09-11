// Lightweight runtime type guards to avoid type assertions
// Keep these generic and reusable across middleware/plugins.

export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
}

export function hasStringProp<K extends string>(obj: unknown, key: K): obj is Record<K, string> {
    return isRecord(obj) && typeof (obj as Record<string, unknown>)[key] === 'string'
}

export function hasId(obj: unknown): obj is { id: string } {
    return hasStringProp(obj, 'id')
}
