# Image processing

Policy

- All uploaded photos are converted to WebP.
- Target size: 350px width x 450px height.
- Maintain aspect ratio with smart fit: cover with center crop to 350x450, or pad with transparent background if cropping is unacceptable for that asset type.
- Strip metadata (EXIF) by default.

Accepted inputs

- MIME types: image/jpeg, image/png, image/webp.
- Max size: 5 MB per file (adjust if needed; see security docs for bodyLimit).
- Max dimensions accepted: up to 4096 x 4096; larger images are downscaled before processing.

Processing pipeline (Sharp)

- Decode → resize to 350x450 (cover) → webp({ quality: 80 }) → output buffer or stream.
- If transparency is present (PNG/WebP), keep it.

Storage

- Store final files as `<id>.webp`.
- Keep original uploads only if there’s a clear business need; otherwise discard to save space and simplify privacy.
- Do not trust user file names; generate IDs (UUID/CUID) server-side.

HTTP delivery

- Content-Type: image/webp.
- Cache-Control: public, max-age=31536000, immutable (filenames must be versioned by ID).
- ETag: enabled (via @fastify/etag or static file server).

Endpoint contract (example)

- Upload: `POST /api/v1/images` (multipart, field name `file`). Returns image id and metadata.
- Download: `GET /api/v1/images/:id/file` → returns `image/webp` 350x450.

Errors

- INVALID_FILE_FORMAT, FILE_TOO_LARGE, FILE_CORRUPTED, UPLOAD_FAILED (see error-handling).

Checklist

- [ ] Input mime/size validated before processing.
- [ ] Resize to 350x450 and convert to WebP.
- [ ] Strip EXIF/metadata by default.
- [ ] Random filenames; originals discarded unless explicitly required.
- [ ] Cache headers set for GET of image files.
