# AI Image Processing

Essential patterns for handling image uploads and processing with Sharp + Fastify.

## Critical Image Rules

1. **Always convert uploads to WebP** for consistent format and smaller size
2. **Always validate file type and size** before processing
3. **Always use server-generated IDs** - never trust user filenames
4. **Always strip metadata** for privacy and security
5. **Use ID as filename** for security - no original filenames stored

## Required Image Upload Handler

Handle multipart file uploads with validation, WebP conversion and database storage.

```ts
import multipart from '@fastify/multipart'
import sharp from 'sharp'

// Register multipart support
await app.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
})

app.post('/api/v1/images', async (req, reply) => {
  const file = await req.file()
  
  if (!file) {
    throw err('VALIDATION_ERROR', 'No file provided')
  }
  
  // Validate MIME type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.mimetype)) {
    throw err('INVALID_FILE_FORMAT', 'Only JPEG, PNG, and WebP files are allowed')
  }
  
  try {
    // Process image with Sharp
    const processedBuffer = await sharp(await file.toBuffer())
      .resize(350, 450, { fit: 'cover', position: 'center' })
      .webp({ quality: 80 })
      .toBuffer()
    
    // Save image directly to database
    const image = await prisma.image.create({
      data: {
        blob: processedBuffer,
        mimeType: 'image/webp',
        size: processedBuffer.length,
        width: 350,
        height: 450,
        ownerId: (req as any).user?.id,
      },
    })
    
    return reply.code(201).send(success(image, req.id))
  } catch (error) {
    throw err('UPLOAD_FAILED', 'Failed to process image')
  }
})
```

## Required Image Serving Handler

Serve images directly from database with proper caching headers.

```ts
app.get('/api/v1/images/:id/file', async (req, reply) => {
  const { id } = req.params
  
  // Get image from database with binary data
  const image = await prisma.image.findUnique({ 
    where: { id },
    select: { blob: true, mimeType: true, size: true }
  })
  
  if (!image) {
    throw err('NOT_FOUND', 'Image not found')
  }
  
  // Set caching headers
  reply.header('Content-Type', image.mimeType)
  reply.header('Cache-Control', 'public, max-age=31536000, immutable')
  reply.header('Content-Length', image.size)
  
  return reply.send(image.blob)
})
```

## Required Image Schema

TypeBox schemas for image upload and metadata.

```ts
import { Type } from '@sinclair/typebox'

export const ImageSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  blob: Type.Any(), // Binary data - excluded from API responses
  description: Type.Optional(Type.String()),
  size: Type.Number(),
  mimeType: Type.String(),
  width: Type.Number(),
  height: Type.Number(),
  ownerId: Type.Optional(Type.String({ format: 'uuid' })),
  visibility: Type.Union([
    Type.Literal('PUBLIC'),
    Type.Literal('PRIVATE'), 
    Type.Literal('HIDDEN')
  ]),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
}, { $id: 'ImageSchema' })

// API response schema (without blob data)
export const ImageMetadataSchema = Type.Omit(ImageSchema, ['blob'])

export const ImageUploadResponse = Type.Object({
  data: ImageMetadataSchema,
  requestId: Type.String(),
  timestamp: Type.String({ format: 'date-time' }),
})

export type Image = Static<typeof ImageSchema>
export type ImageMetadata = Static<typeof ImageMetadataSchema>
```

## Required Prisma Model

Database model for storing images as BLOB data.

```prisma
model Image {
  // Core fields
  id          String  @id @db.Uuid @default(dbgenerated("uuid_generate_v7()"))
  blob        Bytes // Binary data for the image
  description String? // Optional description of the image
  size        Int // Size in bytes
  mimeType    String // e.g., "image/png", "image/jpeg"
  width       Int // Image width in pixels
  height      Int // Image height in pixels

  // Owner
  ownerId String?
  owner   User?   @relation("UserImages", fields: [ownerId], references: [id], onDelete: SetNull)

  // Optional profile picture relation
  userProfile User? @relation("UserProfilePicture")

  // Relations
  characters Character[] @relation("CharacterImages")
  races      Race[]      @relation("RaceImages")
  archetypes Archetype[] @relation("ArchetypeImages")
  skills     Skill[]     @relation("SkillImages")
  items      Item[]      @relation("ItemImages")
  perks      Perk[]      @relation("PerkImages")

  // Visibility and metadata
  visibility Visibility @default(PUBLIC)
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt

  @@index([ownerId])
  @@index([visibility])
  @@index([ownerId, visibility, createdAt(sort: Desc), id(sort: Desc)], name: "idx_images_owner_visibility_recent")
  @@index([visibility, createdAt(sort: Desc), id(sort: Desc)], name: "idx_images_visibility_recent")
  @@map("images")
}
```
