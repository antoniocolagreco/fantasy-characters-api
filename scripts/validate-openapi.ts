#!/usr/bin/env tsx

/**
 * OpenAPI schema validation script
 * Validates the generated OpenAPI schema for correctness
 */

import { spawn } from 'child_process'
import { setTimeout } from 'timers/promises'

import SwaggerParser from '@apidevtools/swagger-parser'

async function startServer(): Promise<() => void> {
    console.log('🚀 Starting server for OpenAPI validation...')

    const serverProcess = spawn('tsx', ['src/server.ts'], {
        env: {
            ...process.env,
            NODE_ENV: 'test',
            PORT: '3001',
            SKIP_DB_CHECK: 'true', // Skip DB check for validation
            LOG_LEVEL: 'warn',
        },
        stdio: 'pipe',
    })

    // Wait for server to start
    await setTimeout(3000)

    return () => {
        serverProcess.kill()
    }
}

async function validateOpenAPI(): Promise<void> {
    console.log('🔍 Validating OpenAPI schema...')

    let stopServer: (() => void) | null = null

    try {
        // Start the server
        stopServer = await startServer()

        console.log('📥 Fetching OpenAPI schema from http://localhost:3001/docs/json...')

        // Fetch the OpenAPI schema
        const response = await fetch('http://localhost:3001/docs/json')

        if (!response.ok) {
            throw new Error(
                `Failed to fetch OpenAPI schema: ${response.status} ${response.statusText}`
            )
        }

        const schema = await response.json()

        console.log('✅ OpenAPI schema fetched successfully')
        console.log(`   Title: ${schema.info?.title || 'Unknown'}`)
        console.log(`   Version: ${schema.info?.version || 'Unknown'}`)
        console.log(`   Paths: ${Object.keys(schema.paths || {}).length}`)

        // Validate the schema using swagger-parser
        console.log('🔧 Validating schema structure...')
        const api = await SwaggerParser.validate(schema)

        console.log('✅ OpenAPI schema validation passed!')
        console.log(`   API Title: ${api.info.title}`)
        console.log(`   API Version: ${api.info.version}`)
        console.log(`   Total Paths: ${Object.keys(api.paths || {}).length}`)

        // Check if it's OpenAPI 3.x (has components)
        const apiV3 = api as any
        if (apiV3.components?.schemas) {
            console.log(`   Components: ${Object.keys(apiV3.components.schemas).length} schemas`)
        }

        // Additional validation checks
        const requiredEndpoints = ['/api/health', '/api/ready']

        const paths = api.paths || {}
        const missingEndpoints = requiredEndpoints.filter(
            endpoint => !Object.keys(paths).includes(endpoint)
        )

        if (missingEndpoints.length > 0) {
            throw new Error(`Missing required endpoints: ${missingEndpoints.join(', ')}`)
        }

        console.log('✅ All required endpoints are documented')

        // Check for proper error responses
        let endpointsWithoutErrorResponses = 0
        for (const [, methods] of Object.entries(paths)) {
            if (methods && typeof methods === 'object') {
                for (const [, operation] of Object.entries(methods as Record<string, unknown>)) {
                    if (operation && typeof operation === 'object' && 'responses' in operation) {
                        const { responses } = operation as any
                        if (responses) {
                            const has4xxResponse = Object.keys(responses).some(
                                code => code.startsWith('4') || code.startsWith('5')
                            )
                            if (!has4xxResponse) {
                                endpointsWithoutErrorResponses++
                            }
                        }
                    }
                }
            }
        }

        if (endpointsWithoutErrorResponses > 0) {
            console.warn(
                `⚠️  Warning: ${endpointsWithoutErrorResponses} endpoints missing error response documentation`
            )
        }

        console.log('\n🎉 OpenAPI validation completed successfully!')
    } catch (error) {
        console.error('❌ OpenAPI validation failed:')
        console.error(error instanceof Error ? error.message : 'Unknown error')
        throw error
    } finally {
        if (stopServer) {
            console.log('🛑 Stopping server...')
            stopServer()
            await setTimeout(1000) // Give server time to shutdown
        }
    }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    validateOpenAPI()
        .then(() => {
            console.log('✅ OpenAPI validation script completed successfully')
            process.exit(0)
        })
        .catch(error => {
            console.error('❌ OpenAPI validation script failed:', error)
            process.exit(1)
        })
}

export { validateOpenAPI }
