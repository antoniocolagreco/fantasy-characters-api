import 'dotenv/config'
import type { PrismaConfig } from 'prisma'

export default {
  migrations: {
    path: './prisma/migrations',
    seed: './prisma/seed.ts',
  },
} satisfies PrismaConfig
