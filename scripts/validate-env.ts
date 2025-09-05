#!/usr/bin/env tsx

/**
 * Environment validation script
 * Vali// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    try {
        validateEnvironment()
        console.log('✅ Environment validation completed successfully')
        process.exit(0)
    } catch (error) {
        console.error('❌ Environment validation failed:', error)
        process.exit(1)
    }
}hat all required environment variables are set and valid
 */

import 'dotenv/config'
import { loadConfig } from '../src/infrastructure/config.js'

function validateEnvironment(): void {
    console.log('🔍 Validating environment configuration...')

    try {
        // Load and validate config (this will throw if invalid)
        const config = loadConfig()

        console.log('✅ Environment validation passed!')
        console.log(`   Environment: ${config.NODE_ENV}`)
        console.log(`   Port: ${config.PORT}`)
        console.log(`   Database: ${config.DATABASE_URL ? '✅ Set' : '❌ Missing'}`)
        console.log(`   JWT Secret: ${config.JWT_SECRET ? '✅ Set' : '❌ Missing'}`)
        console.log(`   JWT Refresh Secret: ${config.JWT_REFRESH_SECRET ? '✅ Set' : '❌ Missing'}`)
        console.log(`   CORS Origins: ${config.CORS_ORIGINS}`)
        console.log(`   OAuth Enabled: ${config.OAUTH_ENABLED}`)

        // Additional validation checks
        if (config.NODE_ENV === 'production') {
            console.log(
                '\n🔐 Production environment detected - running additional security checks...'
            )

            if (!config.JWT_SECRET || config.JWT_SECRET.length < 32) {
                throw new Error('JWT_SECRET must be at least 32 characters in production')
            }

            if (!config.JWT_REFRESH_SECRET || config.JWT_REFRESH_SECRET.length < 32) {
                throw new Error('JWT_REFRESH_SECRET must be at least 32 characters in production')
            }

            if (
                config.JWT_SECRET ===
                'your-super-secret-jwt-key-minimum-32-characters-long-change-this-in-production'
            ) {
                throw new Error('JWT_SECRET must be changed from default value in production')
            }

            if (!config.DATABASE_URL) {
                throw new Error('DATABASE_URL is required in production')
            }

            console.log('✅ Production security checks passed!')
        }

        console.log('\n🎉 All environment validations passed!')
        process.exit(0)
    } catch (error) {
        console.error('❌ Environment validation failed:')
        console.error(error instanceof Error ? error.message : 'Unknown error')
        console.error('\n💡 Tip: Copy .env.example to .env and fill in the required values')
        process.exit(1)
    }
}

export { validateEnvironment }

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    try {
        validateEnvironment()
        console.log('✅ Environment validation script completed successfully')
    } catch (error) {
        console.error('❌ Validation script failed:', error)
        process.exit(1)
    }
}
