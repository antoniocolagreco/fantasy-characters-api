#!/usr/bin/env tsx

/**
 * OpenAPI schema validation script
 * Validates the generated OpenAPI schema for correctness
 */

import { spawn } from 'child_process'
import { createServer } from 'net'
import { setTimeout } from 'timers/promises'

import SwaggerParser from '@apidevtools/swagger-parser'

const DEFAULT_PORT = 3000
const PORT_SCAN_END = 3010
const PORT_SCAN_START = DEFAULT_PORT + 1 // Prefer avoiding 3000 where dev server may run

// Note: we no longer reuse an existing server; always start a temporary one on a free port

async function startServer(port: number): Promise<() => void> {
    console.log(`🚀 Starting server for OpenAPI validation on port ${port} ...`)

    const serverProcess = spawn('pnpm', ['exec', 'tsx', 'src/server.ts'], {
        env: {
            ...process.env,
            NODE_ENV: 'test',
            PORT: port.toString(),
            SKIP_DB_CHECK: 'true', // Skip DB check for validation
            LOG_LEVEL: 'warn',
        },
        stdio: 'pipe',
        shell: true, // Required on Windows
    })

    // Wait for server to start
    await setTimeout(3000)

    return () => {
        serverProcess.kill()
    }
}

async function isPortFree(port: number): Promise<boolean> {
    return new Promise(resolve => {
        const srv = createServer()
        srv.once('error', () => {
            resolve(false)
        })
        srv.once('listening', () => {
            srv.close(() => resolve(true))
        })
        srv.listen(port, '127.0.0.1')
    })
}

async function findFirstAvailablePort(start: number, end: number): Promise<number | null> {
    for (let port = start; port <= end; port++) {
        const free = await isPortFree(port)
        if (free) return port
    }
    return null
}

async function waitForDocs(port: number, timeoutMs = 10000): Promise<void> {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
        try {
            const res = await fetch(`http://localhost:${port}/docs/json`)
            if (res.ok) return
        } catch {
            // ignore
        }
        await setTimeout(200)
    }
    throw new Error('Timed out waiting for /docs/json')
}

async function validateOpenAPI(): Promise<void> {
    console.log('🔍 Validating OpenAPI schema...')

    // Always start on the first available port starting from DEFAULT_PORT
    let port = DEFAULT_PORT
    let stopServer: (() => void) | null = null

    try {
        const free = await findFirstAvailablePort(PORT_SCAN_START, PORT_SCAN_END)
        if (free === null) {
            throw new Error(`No available port found between ${DEFAULT_PORT}-${PORT_SCAN_END}`)
        }
        port = free
        console.log(`🚦 Starting isolated test server on first available port ${port} ...`)
        stopServer = await startServer(port)
        await waitForDocs(port)

        console.log(`📥 Fetching OpenAPI schema from http://localhost:${port}/docs/json...`)

        // Fetch the OpenAPI schema
        const response = await fetch(`http://localhost:${port}/docs/json`)

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
            console.log('🛑 Stopping test server...')
            stopServer()
            await setTimeout(1000) // Give server time to shutdown
        }
    }
}

// Run validation if called directly
if (
    process.argv[1]?.endsWith('validate-openapi.ts') ||
    process.argv[1]?.endsWith('validate-openapi.js')
) {
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
