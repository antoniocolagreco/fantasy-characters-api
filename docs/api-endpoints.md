# API Endpoints

## Authentication Endpoints

### User Authentication

```typescript
POST / api / auth / register // Register new user
POST / api / auth / login // User login
POST / api / auth / logout // User logout
POST / api / auth / refresh // Refresh JWT token
```

### User Profile

```typescript
GET / api / auth / profile // Get current user profile
PUT / api / auth / profile // Update user profile
PUT / api / auth / password // Change password
```

## User Management Endpoints

### Users CRUD

```typescript
GET    /api/users                  // List all users with pagination and filtering
GET    /api/users/:id              // Get user by ID with full profile
GET    /api/users/stats            // Get user statistics
POST   /api/users                  // Create new user with validation
PUT    /api/users/:id              // Update user (partial updates supported)
DELETE /api/users/:id              // Delete user (CASCADE deletes related data)
```

## Image Management Endpoints

### User Images

```typescript
GET    /api/images                 // List all images without blob
GET    /api/images/:id             // Get image by ID (metadata only)
GET    /api/images/:id/file        // Get image binary data (WebP format)
GET    /api/images/stats           // Get image statistics
POST   /api/images                 // Upload new image
PUT    /api/images/:id             // Update image
DELETE /api/images/:id             // Delete image
```

### Image Binary Serving

The API provides a specialized endpoint for serving image binary data:

```typescript
GET /api/images/:id/file        // Serve image binary data directly
```

**Features:**

- Returns WebP format images (max 350x450px)
- Optimized HTTP caching headers (1-year cache)
- Proper Content-Type and Content-Disposition headers
- No authentication required (public endpoint)
- Efficient binary data streaming

**Response Headers:**

- `Content-Type: image/webp`
- `Cache-Control: public, max-age=31536000`
- `Content-Length: {size in bytes}`
- `Content-Disposition: inline; filename="{original-filename}"`

**Status Codes:**

- `200`: Image served successfully
- `404`: Image not found
- `400`: Invalid UUID format

## Character Management Endpoints

### Characters CRUD

```typescript
GET    /api/characters             // List characters (with pagination)
GET    /api/characters/:id         // Get character by ID
GET    /api/characters/stats       // Get character statistics
POST   /api/characters             // Create new character
PUT    /api/characters/:id         // Update character
DELETE /api/characters/:id         // Delete character
```

## Game System Endpoints

### Races CRUD

```typescript
GET    /api/races                  // List all races
GET    /api/races/:id              // Get race by ID
GET    /api/races/stats            // Get race statistics
POST   /api/races                  // Create new race (admin)
PUT    /api/races/:id              // Update race (admin)
DELETE /api/races/:id              // Delete race (admin)
```

### Archetypes CRUD

```typescript
GET    /api/archetypes             // List all archetypes
GET    /api/archetypes/:id         // Get archetype by ID
GET    /api/archetypes/stats       // Get archetype statistics
POST   /api/archetypes             // Create new archetype (admin)
PUT    /api/archetypes/:id         // Update archetype (admin)
DELETE /api/archetypes/:id         // Delete archetype (admin)
```

### Skills CRUD

```typescript
GET    /api/skills                 // List all skills
GET    /api/skills/:id             // Get skill by ID
GET    /api/skills/stats           // Get skill statistics
POST   /api/skills                 // Create new skill (admin)
PUT    /api/skills/:id             // Update skill (admin)
DELETE /api/skills/:id             // Delete skill (admin)
```

### Perks CRUD

```typescript
GET    /api/perks                  // List all perks
GET    /api/perks/:id              // Get perk by ID
GET    /api/perks/stats            // Get perk statistics
POST   /api/perks                  // Create new perk (admin)
PUT    /api/perks/:id              // Update perk (admin)
DELETE /api/perks/:id              // Delete perk (admin)
```

## Item Management Endpoints

### Items CRUD

```typescript
GET    /api/items                  // List all items
GET    /api/items/:id              // Get item by ID
GET    /api/items/stats            // Get item statistics
POST   /api/items                  // Create new item (admin)
PUT    /api/items/:id              // Update item (admin)
DELETE /api/items/:id              // Delete item (admin)
```

## Tag Management Endpoints

### Tags CRUD

```typescript
GET    /api/tags                   // List all tags
GET    /api/tags/:id               // Get tag by ID
GET    /api/tags/stats             // Get tag statistics
POST   /api/tags                   // Create new tag
PUT    /api/tags/:id               // Update tag
DELETE /api/tags/:id               // Delete tag
```

## Utility Endpoints

### Health Check Endpoints (Kubernetes Compatible)

```typescript
GET / api / health // Standard health check
GET / api / healthz // Kubernetes-style health check
GET / api / ready // Kubernetes readiness probe
GET / api / live // Kubernetes liveness probe
```
