import 'dotenv/config'
import type { PrismaConfig } from 'prisma'

export default {
  migrations: {
    path: './prisma/migrations',
  },
} satisfies PrismaConfig
