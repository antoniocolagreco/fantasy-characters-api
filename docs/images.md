# Images Feature (v1)

Image upload, processing, storage, and serving with automatic WebP conversion.

## Image Processing Rules

1. **Always convert to WebP** - All uploads processed to WebP format for
   consistency
2. **File validation** - Max 5MB, JPEG/PNG/WebP input only
3. **Auto-resize** - Large images resized to max 2048x2048px (preserves aspect
   ratio)
4. **Strip metadata** - All EXIF/metadata removed for privacy
5. **Server-generated IDs** - Never trust user filenames

## API Endpoints

```http
GET    /api/v1/images           # List image metadata
GET    /api/v1/images/:id       # Get image metadata by ID
GET    /api/v1/images/:id/file  # Download WebP binary
GET    /api/v1/images/stats     # Image statistics
POST   /api/v1/images           # Upload image (multipart)
PUT    /api/v1/images/:id       # Update metadata/replace file
DELETE /api/v1/images/:id       # Delete image
```

## Processing Pipeline

Images automatically processed using Sharp library:

```ts
// Configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_DIMENSIONS = 2048 // 2048x2048px
const WEBP_QUALITY = 80

// Process: validate → resize → convert to WebP → store
async function processImageToWebP(buffer: Buffer) {
  return sharp(buffer)
    .resize(MAX_DIMENSIONS, MAX_DIMENSIONS, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer()
}
```

## Database Model

```prisma
model Image {
  id          String  @id @db.Uuid
  blob        Bytes   // WebP binary data
  description String? // Optional description
  size        Int     // File size in bytes
  mimeType    String  // Always "image/webp"
  width       Int     // Processed width
  height      Int     // Processed height

  // Relations
  ownerId    String? @db.Uuid
  owner      User?   @relation("UserImages", fields: [ownerId], references: [id])
  visibility Visibility @default(PUBLIC)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@map("images")
}
```

## File Upload & Serving

### Upload Handler

```ts
async uploadImage(request: FastifyRequest, reply: FastifyReply) {
  const file = await request.file()
  const buffer = await file.toBuffer()

  // Validate → Process → Store
  validateImageFile(file, buffer)
  const processed = await processImageToWebP(buffer)
  const image = await createImageInDb(processed)

  return reply.code(201).send(success(image, request.id))
}
```

### Binary File Serving

```ts
async getImageFile(request: FastifyRequest, reply: FastifyReply) {
  const imageFile = await getImageBinaryById(request.params.id)

  reply.header('Content-Type', 'image/webp')
  reply.header('Cache-Control', 'public, max-age=31536000, immutable')
  return reply.send(imageFile.blob)
}
```
