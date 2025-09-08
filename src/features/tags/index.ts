// ===== Schemas (HTTP layer v1) =====
export * from './v1/tags.http.schema'

// ===== Repository =====
export { tagRepository } from './tags.repository'

// ===== Service =====
export { tagService } from './tags.service'

// ===== Routes =====
export { tagsRoutesV1 } from './v1/tags.routes'
