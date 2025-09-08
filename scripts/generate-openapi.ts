#!/usr/bin/env tsx
/**
 * Generates a cleaned OpenAPI JSON snapshot (openapi.json) and validates it.
 * Keeps runtime schemas (with transform, etc.) untouched; cleaning is docs-only.
 */
import { spawn, type ChildProcess } from 'child_process'
import { writeFileSync } from 'fs'
import { createServer } from 'net'
import { setTimeout } from 'timers/promises'

import SwaggerParser from '@apidevtools/swagger-parser'

const PORT_RANGE_START = 3001
const PORT_RANGE_END = 3010

async function isPortFree(port: number): Promise<boolean> {
    return new Promise(resolve => {
        const srv = createServer()
        srv.once('error', () => resolve(false))
        srv.once('listening', () => srv.close(() => resolve(true)))
        srv.listen(port, '127.0.0.1')
    })
}

async function findPort(): Promise<number> {
    for (let p = PORT_RANGE_START; p <= PORT_RANGE_END; p++) if (await isPortFree(p)) return p
    throw new Error('No free port available for OpenAPI generation')
}

function killProcessTree(child: ChildProcess): void {
    if (!child.pid) return
    if (process.platform === 'win32') {
        // Use taskkill to ensure the entire tree is terminated on Windows
        spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
    } else {
        child.kill('SIGTERM')
    }
}

async function startServer(
    port: number
): Promise<{ stop: () => Promise<void>; child: ChildProcess }> {
    const child = spawn('pnpm', ['exec', 'tsx', 'src/server.ts'], {
        env: {
            ...process.env,
            NODE_ENV: 'test',
            PORT: String(port),
            SKIP_DB_CHECK: 'true',
            LOG_LEVEL: 'warn',
        },
        stdio: 'ignore',
        shell: true,
    })
    await setTimeout(3000)
    const stop = async () => {
        killProcessTree(child)
        await setTimeout(300) // allow OS to reclaim resources
    }
    return { stop, child }
}

const EXPLICIT_STRIP = new Set([
    'transform',
    'examples',
    'errorMessage',
    'patternProperties',
    'unevaluatedProperties',
])

function shouldStripKey(key: string): boolean {
    return key !== '$ref' && (key.startsWith('$') || EXPLICIT_STRIP.has(key))
}

function scrub(input: unknown): unknown {
    if (Array.isArray(input)) return input.map(scrub)
    if (input && typeof input === 'object') {
        const out: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(input)) {
            if (shouldStripKey(k)) continue
            out[k] = scrub(v)
        }
        return out
    }
    return input
}

async function generateAndValidate() {
    console.log('🧬 Generating OpenAPI specification (runtime → cleaned snapshot)...')
    const port = await findPort()
    const { stop, child } = await startServer(port)

    let stopping = false
    const gracefulStop = async () => {
        if (stopping) return
        stopping = true
        await stop()
    }

    process.on('SIGINT', async () => {
        console.log('\n🛑 Interrupted, cleaning up...')
        await gracefulStop()
        process.exit(130)
    })
    process.on('exit', () => {
        if (!stopping && child.pid) killProcessTree(child)
    })

    try {
        const res = await fetch(`http://localhost:${port}/docs/json`)
        if (!res.ok) throw new Error(`/docs/json returned ${res.status}`)
        const rawSpec = await res.json()

        // Clean spec for export (docs-only transformation)
        const cleaned = scrub(rawSpec)

        // Persist cleaned spec
        writeFileSync('openapi.json', JSON.stringify(cleaned, null, 2))
        console.log('💾 Wrote cleaned openapi.json')

        // Quick stats
        const pathCount = Object.keys((cleaned as any).paths || {}).length
        console.log(`📊 Paths: ${pathCount}`)

        // Validate cleaned spec
        console.log('🔍 Validating cleaned OpenAPI spec...')
        const api = await SwaggerParser.validate(cleaned as any)
        console.log('✅ Validation passed:')
        console.log(`   Title: ${api.info?.title}`)
        console.log(`   Version: ${api.info?.version}`)
        console.log(`   Paths: ${Object.keys(api.paths || {}).length}`)
        const compSchemas = (api as any).components?.schemas
        if (compSchemas) console.log(`   Schemas: ${Object.keys(compSchemas).length}`)

        // Ensure health endpoints present
        const required = ['/api/health', '/api/ready']
        const missing = required.filter(p => !(api.paths && p in api.paths))
        if (missing.length) throw new Error(`Missing required endpoints: ${missing.join(', ')}`)
        console.log('✅ Required endpoints present')

        console.log('🎉 OpenAPI generation + validation complete')
    } finally {
        await gracefulStop()
    }
}

generateAndValidate()
    .then(() => {
        // Force exit to prevent lingering handles from keeping process alive
        process.exit(0)
    })
    .catch(err => {
        console.error('❌ Failed to generate/validate OpenAPI spec')
        console.error(err instanceof Error ? err.message : err)
        process.exit(1)
    })
