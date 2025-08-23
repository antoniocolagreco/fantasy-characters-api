# PostgreSQL Configuration

## Overview

The Fantasy Character API uses PostgreSQL as the production database to support thousands of
concurrent users with high performance, reliability, and scalability.

## Database Setup

### Local Development with Docker

For local development, use the provided Docker Compose configuration:

```bash
# Start PostgreSQL container
docker-compose up -d database

# Run the application
docker-compose up app
```

### Production Deployment

#### Managed PostgreSQL Services

**Recommended for production:**

- **AWS RDS PostgreSQL**: Fully managed with automated backups, monitoring, and scaling
- **Google Cloud SQL**: High availability with read replicas and automatic failover
- **Azure Database for PostgreSQL**: Built-in security and compliance features
- **DigitalOcean Managed Databases**: Cost-effective with automatic maintenance

#### Self-Hosted PostgreSQL

For self-hosted deployments, ensure:

- **PostgreSQL 14+**: Latest stable version for performance and security
- **Connection Pooling**: Use PgBouncer or built-in pooling
- **SSL/TLS**: Encrypted connections for security
- **Backup Strategy**: Regular automated backups with point-in-time recovery
- **Monitoring**: Performance metrics and alerting

## Environment Configuration

### Required Environment Variables

```bash
# Production PostgreSQL Connection
DATABASE_URL=postgresql://username:password@hostname:5432/fantasy_characters_db

# Development (Docker Compose)
DATABASE_URL=postgresql://developer:password@localhost:5432/fantasy_character_api

# PostgreSQL for all environments
DATABASE_URL=file:./test.db
```

### Connection String Format

```text
postgresql://[username[:password]@][host[:port]][/database][?parameter_list]
```

**Example Parameters:**

```bash
# With SSL and connection pooling
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require&pool_timeout=10&connection_limit=20

# For AWS RDS
DATABASE_URL=postgresql://username:password@mydb.cluster-xyz.us-east-1.rds.amazonaws.com:5432/fantasy_characters_db?sslmode=require
```

## Performance Optimization

### Connection Pooling

Prisma automatically handles connection pooling, but for high concurrency:

```bash
# Environment variables for connection pooling
DATABASE_URL=postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10
```

### Database Indexes

The schema includes optimized indexes for:

- **User queries**: Email, name, role
- **Content visibility**: ownerId, visibility
- **Character operations**: Race, archetype, level
- **Equipment lookups**: Character ID, item slots
- **Search operations**: Names across all entities

### Query Optimization

- **Selective fetching**: Only load needed relations
- **Batch operations**: Use Prisma's batch operations for bulk inserts
- **Caching**: HTTP caching middleware for read-heavy operations
- **Read replicas**: Use read replicas for analytics and reporting

## Scalability Considerations

### Horizontal Scaling

- **Read Replicas**: Distribute read operations across replicas
- **Connection Pooling**: PgBouncer for connection management
- **Sharding**: Partition data by user ID or region (advanced)

### Vertical Scaling

- **CPU**: Multi-core processors for query processing
- **Memory**: Large buffer pools for caching
- **Storage**: SSD storage with high IOPS

### Concurrent User Support

For thousands of concurrent users:

```bash
# PostgreSQL configuration (postgresql.conf)
max_connections = 200                  # Adjust based on hardware
shared_buffers = 256MB                 # 25% of available RAM
effective_cache_size = 1GB             # 50-75% of available RAM
work_mem = 4MB                         # Per-connection work memory
maintenance_work_mem = 64MB            # Maintenance operations
checkpoint_completion_target = 0.9     # Write performance
wal_buffers = 16MB                     # Write-ahead logging
default_statistics_target = 100        # Query planner statistics
```

## Migration Strategy

### Development to Production

1. **Schema Sync**: Use Prisma migrations to sync schema changes
2. **Data Migration**: Run migration scripts before deployment
3. **Zero-Downtime**: Use blue-green deployment for schema changes
4. **Rollback Plan**: Database snapshots before major changes

### Migration Commands

```bash
# Generate migration
pnpm prisma migrate dev --name description

# Deploy to production
pnpm prisma migrate deploy

# Reset development database
pnpm prisma migrate reset
```

## Backup and Recovery

### Automated Backups

```bash
# Daily backup script
pg_dump -h hostname -U username -d fantasy_characters_db -f backup_$(date +%Y%m%d).sql

# Restore from backup
psql -h hostname -U username -d fantasy_characters_db -f backup_20241201.sql
```

### Point-in-Time Recovery

For managed services, enable automated backups with:

- **Retention Period**: 7-30 days based on requirements
- **Backup Window**: During low-traffic hours
- **Cross-Region Backup**: For disaster recovery

## Monitoring and Maintenance

### Key Metrics

Monitor these PostgreSQL metrics:

- **Connection Count**: Active vs. maximum connections
- **Query Performance**: Slow query log and execution times
- **Cache Hit Ratio**: Buffer cache efficiency
- **Disk I/O**: Read/write operations and latency
- **Replication Lag**: For read replicas

### Maintenance Tasks

- **VACUUM**: Regular cleanup of deleted rows
- **ANALYZE**: Update query planner statistics
- **REINDEX**: Rebuild fragmented indexes
- **Log Rotation**: Manage PostgreSQL logs

### Alerting

Set up alerts for:

- High connection usage (>80% of max_connections)
- Slow queries (>1 second execution time)
- Low cache hit ratio (<95%)
- Disk space usage (>80% full)
- Replication lag (>5 seconds)

## Security Best Practices

### Authentication

- **Strong Passwords**: Use complex passwords for database users
- **Limited Privileges**: Grant minimum required permissions
- **SSL/TLS**: Always use encrypted connections
- **Network Security**: Restrict access by IP addresses

### Database Security

```sql
-- Create application user with limited privileges
CREATE USER fantasy_app WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE fantasy_characters_db TO fantasy_app;
GRANT USAGE ON SCHEMA public TO fantasy_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO fantasy_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO fantasy_app;
```

### Connection Security

```bash
# SSL mode options
sslmode=disable     # No SSL (development only)
sslmode=allow       # Try SSL, fallback to non-SSL
sslmode=prefer      # Try SSL, fallback to non-SSL with warning
sslmode=require     # Require SSL (production)
sslmode=verify-ca   # Require SSL and verify CA
sslmode=verify-full # Require SSL and verify certificate
```

## Troubleshooting

### Common Issues

**Too many connections:**

```bash
# Check current connections
SELECT count(*) FROM pg_stat_activity;

# Kill idle connections
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle';
```

**Slow queries:**

```bash
# Enable slow query log
ALTER SYSTEM SET log_min_duration_statement = 1000;  # Log queries > 1 second
SELECT pg_reload_conf();

# Find slow queries
SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;
```

**Connection timeouts:**

```bash
# Increase connection timeout
DATABASE_URL=postgresql://user:pass@host:5432/db?connect_timeout=30
```

### Performance Tuning

**Memory settings for high concurrency:**

```bash
# For 8GB RAM server
shared_buffers = 2GB
effective_cache_size = 6GB
work_mem = 2MB
maintenance_work_mem = 512MB
```

**Connection pooling with PgBouncer:**

```ini
[databases]
fantasy_characters_db = host=localhost port=5432 dbname=fantasy_characters_db

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
reserve_pool_size = 5
```

## Cost Optimization

### Managed Service Costs

- **Right-sizing**: Choose appropriate instance size for workload
- **Reserved Instances**: Use reserved instances for predictable workloads
- **Read Replicas**: Use read replicas only when needed
- **Automated Scaling**: Configure auto-scaling for variable loads

### Query Optimization

- **Efficient Queries**: Use indexes and avoid N+1 queries
- **Connection Pooling**: Reduce connection overhead
- **Caching**: Cache frequently accessed data
- **Batch Operations**: Group multiple operations together

## Migration from SQLite

### Schema Compatibility

The Prisma schema is designed to work exclusively with PostgreSQL across all environments
(development, testing, and production) for maximum consistency and reliability:

1. **Data Types**: Native PostgreSQL data types throughout
2. **Constraints**: Full foreign key constraint support
3. **Indexes**: Optimized PostgreSQL indexes
4. **UUIDs**: Native UUID support across all environments

### Migration Steps

1. **Export PostgreSQL Data**: Use Prisma studio or custom export scripts
2. **Setup PostgreSQL**: Configure production PostgreSQL instance
3. **Run Migrations**: Apply schema to PostgreSQL
4. **Import Data**: Use custom migration scripts if needed
5. **Update Environment**: Change DATABASE_URL to PostgreSQL
6. **Test**: Verify all functionality works correctly

### Data Export Script

```typescript
// scripts/export-postgres-data.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: { url: 'file:./dev.db' },
  },
})

async function exportData() {
  const users = await prisma.user.findMany()
  const characters = await prisma.character.findMany()
  // Export other entities...

  // Save to JSON files for import
  await fs.writeFile('users.json', JSON.stringify(users, null, 2))
  await fs.writeFile('characters.json', JSON.stringify(characters, null, 2))
}
```
