# API Endpoints

All endpoints are exposed under versioned prefixes. Current stable version is
`v1`. Future versions (e.g., `v2`) will live alongside v1 without breaking
changes.

## 1. Utility / health checks

```http
GET /api/health   # Basic health check for monitoring and load balancers
GET /api/ready    # Readiness check for orchestration (database + migrations)
```

## 2. Users

```http
GET    /api/v1/users             # List users (pagination, filtering)
GET    /api/v1/users/:id         # Get user by ID (full profile)
GET    /api/v1/users/stats       # User statistics
POST   /api/v1/users             # Create user (admin or system flows)
PUT    /api/v1/users/:id         # Update user (partial updates allowed)
DELETE /api/v1/users/:id         # Delete user (cascades to related data)
POST   /api/v1/users/:id/ban     # Ban/Unban a user (RBAC: moderator→USER only; admin→USER|MODERATOR)
```

## 3. Authentication

```http
POST   /api/v1/auth/register      # Register new user
POST   /api/v1/auth/login         # User login (returns JWT)
POST   /api/v1/auth/logout        # User logout (invalidate/rotate token)
POST   /api/v1/auth/logout-all    # Logout from all devices
POST   /api/v1/auth/refresh       # Refresh JWT token
PUT    /api/v1/auth/change-password      # Change password

# OAuth2 (Optional)
GET    /api/v1/auth/oauth/:provider/start     # Redirect to provider (google, github)
GET    /api/v1/auth/oauth/:provider/callback  # Handle callback
POST   /api/v1/auth/oauth/link                # Link provider to account
POST   /api/v1/auth/oauth/unlink              # Unlink provider
```

## 4. Images

```http
GET    /api/v1/images                # List image metadata (no binary)
GET    /api/v1/images/:id            # Get image metadata by ID
GET    /api/v1/images/:id/file       # Get image binary (WebP - id.webp)
GET    /api/v1/images/stats          # Image statistics
POST   /api/v1/images                # Upload new image (multipart)
PUT    /api/v1/images/:id            # Update image metadata or replace file
DELETE /api/v1/images/:id            # Delete image
```

## 5. Tags

```http
GET    /api/v1/tags                   # List tags
GET    /api/v1/tags/:id               # Get tag by ID
GET    /api/v1/tags/stats             # Tag statistics
POST   /api/v1/tags                   # Create tag
PUT    /api/v1/tags/:id               # Update tag
DELETE /api/v1/tags/:id               # Delete tag
```

## 6. Skills

```http
GET    /api/v1/skills                 # List skills
GET    /api/v1/skills/:id             # Get skill by ID
GET    /api/v1/skills/stats           # Skill statistics
POST   /api/v1/skills                 # Create skill
PUT    /api/v1/skills/:id             # Update skill
DELETE /api/v1/skills/:id             # Delete skill
```

## 7. Perks

```http
GET    /api/v1/perks                  # List perks
GET    /api/v1/perks/:id              # Get perk by ID
GET    /api/v1/perks/stats            # Perk statistics
POST   /api/v1/perks                  # Create perk
PUT    /api/v1/perks/:id              # Update perk
DELETE /api/v1/perks/:id              # Delete perk
```

## 8. Archetypes

```http
GET    /api/v1/archetypes             # List archetypes
GET    /api/v1/archetypes/:id         # Get archetype by ID
GET    /api/v1/archetypes/stats       # Archetype statistics
POST   /api/v1/archetypes             # Create archetype
PUT    /api/v1/archetypes/:id         # Update archetype
DELETE /api/v1/archetypes/:id         # Delete archetype
```

## 9. Races

```http
GET    /api/v1/races                  # List races
GET    /api/v1/races/:id              # Get race by ID
GET    /api/v1/races/stats            # Race statistics
POST   /api/v1/races                  # Create race
PUT    /api/v1/races/:id              # Update race
DELETE /api/v1/races/:id              # Delete race
```

## 10. Items

```http
GET    /api/v1/items                  # List items
GET    /api/v1/items/:id              # Get item by ID
GET    /api/v1/items/stats            # Item statistics
POST   /api/v1/items                  # Create item
PUT    /api/v1/items/:id              # Update item
DELETE /api/v1/items/:id              # Delete item
```

## 11. Equipment

```http
GET    /api/v1/characters/:id/equipment   # Get character equipment
PUT    /api/v1/characters/:id/equipment   # Update character equipment (equip/unequip)
GET    /api/v1/equipment/stats            # Equipment statistics
```

## 12. Characters

```http
GET    /api/v1/characters             # List characters
GET    /api/v1/characters/:id         # Get character by ID
GET    /api/v1/characters/stats       # Character statistics
POST   /api/v1/characters             # Create character
PUT    /api/v1/characters/:id         # Update character
DELETE /api/v1/characters/:id         # Delete character
```
