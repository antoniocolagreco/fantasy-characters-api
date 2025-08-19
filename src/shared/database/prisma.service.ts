import { PrismaClient } from '@prisma/client'
import { environment } from '@/shared/config.js'

/**
 * Prisma client configuration with connection pooling and error handling
 */
const createPrismaClient = (): PrismaClient => {
  const isDevelopment = environment.NODE_ENV === 'development'

  return new PrismaClient({
    // log: isDevelopment ? ['query', 'info', 'warn', 'error'] : ['error'],
    log: ['warn', 'error'],
    errorFormat: isDevelopment ? 'pretty' : 'minimal',
    datasources: {
      db: {
        url: environment.DATABASE_URL,
      },
    },
  })
}

/**
 * Global Prisma client instance
 * Uses singleton pattern to ensure single database connection
 */
let prisma: PrismaClient | undefined

/**
 * Get the Prisma client instance
 * Creates a new instance if one doesn't exist
 */
export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = createPrismaClient()
  }
  return prisma
}

/**
 * Connect to the database
 * Establishes connection and verifies it's working
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    const client = getPrismaClient()
    await client.$connect()
    // eslint-disable-next-line no-console
    console.log('📦 Database connected successfully')
  } catch (error) {
    console.error('❌ Failed to connect to database:', error)
    throw error
  }
}

/**
 * Disconnect from the database
 * Closes all connections and cleans up resources
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    if (prisma) {
      await prisma.$disconnect()
      prisma = undefined
      // eslint-disable-next-line no-console
      console.log('📦 Database disconnected successfully')
    }
  } catch (error) {
    console.error('❌ Failed to disconnect from database:', error)
    throw error
  }
}

/**
 * Test database connection
 * Performs a simple query to verify connectivity
 */
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const client = getPrismaClient()
    await client.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('❌ Database connection test failed:', error)
    return false
  }
}

/**
 * Get database health information
 * Returns connection status and basic metrics
 */
export const getDatabaseHealth = async (): Promise<{
  status: 'healthy' | 'unhealthy'
  connected: boolean
  version?: string
  errorMessage?: string
}> => {
  try {
    const client = getPrismaClient()

    // Test basic connectivity
    await client.$queryRaw`SELECT 1`

    // Get SQLite version
    const versionResult = await client.$queryRaw<Array<{ 'sqlite_version()': string }>>`
      SELECT sqlite_version()
    `
    const version = versionResult[0]?.['sqlite_version()']

    return {
      status: 'healthy',
      connected: true,
      version,
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      connected: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Execute database transaction
 * Wraps operations in a transaction for data consistency
 */
export const executeTransaction = async <T>(
  operation: (
    client: Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >,
  ) => Promise<T>,
): Promise<T> => {
  const client = getPrismaClient()
  return client.$transaction(operation)
}

/**
 * Export the default Prisma client
 * This is the main client instance to use throughout the application
 */
export const db = getPrismaClient()

// Export common types for convenience
export type {
  Archetype,
  Character,
  Image,
  Item,
  Perk,
  Race,
  Rarity,
  Role,
  Skill,
  Slot,
  Tag,
  User,
} from '@prisma/client'
