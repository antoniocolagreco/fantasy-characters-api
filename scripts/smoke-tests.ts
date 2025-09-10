#!/usr/bin/env tsx

/**
 * Smoke test script for deployment validation
 * Tests basic API functionality after deployment
 */

import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { setTimeout } from 'timers/promises'

interface SmokeTestConfig {
    baseUrl: string
    timeout: number
    retries: number
    slowWarningMs: number
    token?: string
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface EndpointSpec {
    path: string
    method?: HttpMethod
    expect: number | number[]
    name?: string
    requiresAuth?: boolean
}

interface TestResult {
    endpoint: string
    status: 'PASS' | 'FAIL'
    statusCode?: number
    responseTime?: number
    error?: string
}

class SmokeTestRunner {
    private config: SmokeTestConfig
    private results: TestResult[] = []

    constructor(config: SmokeTestConfig) {
        this.config = config
    }

    private async makeRequest(endpoint: string): Promise<TestResult> {
        const startTime = Date.now()
        const url = `${this.config.baseUrl}${endpoint}`

        try {
            console.log(`🔍 Testing ${endpoint}...`)

            // Use built-in timeout signal (Node 18+)
            const timeoutSignal = (AbortSignal as any).timeout
                ? (AbortSignal as any).timeout(this.config.timeout)
                : undefined

            const response = await fetch(url, {
                signal: timeoutSignal,
                headers: {
                    'User-Agent': 'FantasyAPI-SmokeTest/1.0',
                    Accept: 'application/json',
                    Connection: 'close',
                },
            })

            const responseTime = Date.now() - startTime

            if (response.ok) {
                console.log(`  ✅ ${endpoint} - ${response.status} (${responseTime}ms)`)
                return {
                    endpoint,
                    status: 'PASS',
                    statusCode: response.status,
                    responseTime,
                }
            } else {
                console.log(
                    `  ❌ ${endpoint} - ${response.status} ${response.statusText} (${responseTime}ms)`
                )
                return {
                    endpoint,
                    status: 'FAIL',
                    statusCode: response.status,
                    responseTime,
                    error: `HTTP ${response.status}: ${response.statusText}`,
                }
            }
        } catch (error) {
            const responseTime = Date.now() - startTime
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'

            console.log(`  ❌ ${endpoint} - ERROR (${responseTime}ms): ${errorMessage}`)

            return {
                endpoint,
                status: 'FAIL',
                responseTime,
                error: errorMessage,
            }
        }
    }

    private getAuthHeaders(): Record<string, string> {
        return this.config.token ? { Authorization: `Bearer ${this.config.token}` } : {}
    }

    private async request(spec: EndpointSpec): Promise<TestResult> {
        const startTime = Date.now()
        const url = `${this.config.baseUrl}${spec.path}`
        const method = spec.method ?? 'GET'

        try {
            console.log(`🔍 ${method} ${spec.path}${spec.name ? ` — ${spec.name}` : ''}`)

            const timeoutSignal = (
                AbortSignal as unknown as { timeout?: (ms: number) => AbortSignal }
            ).timeout
                ? (AbortSignal as unknown as { timeout: (ms: number) => AbortSignal }).timeout(
                      this.config.timeout
                  )
                : undefined

            const response = await fetch(url, {
                method,
                signal: timeoutSignal,
                headers: {
                    'User-Agent': 'FantasyAPI-SmokeTest/1.0',
                    Accept: 'application/json',
                    Connection: 'close',
                    ...this.getAuthHeaders(),
                },
            })

            const responseTime = Date.now() - startTime
            const expected = Array.isArray(spec.expect) ? spec.expect : [spec.expect]
            const ok = expected.includes(response.status)

            const msg = `${response.status} (${responseTime}ms)`
            if (ok) {
                const slow = responseTime > this.config.slowWarningMs
                console.log(`  ✅ ${spec.path} - ${msg}${slow ? ' • slow' : ''}`)
                return {
                    endpoint: spec.path,
                    status: 'PASS',
                    statusCode: response.status,
                    responseTime,
                }
            }

            console.log(`  ❌ ${spec.path} - ${msg}`)
            return {
                endpoint: spec.path,
                status: 'FAIL',
                statusCode: response.status,
                responseTime,
                error: `Expected ${expected.join('/')}, got ${response.status}`,
            }
        } catch (error) {
            const responseTime = Date.now() - startTime
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            console.log(`  ❌ ${spec.path} - ERROR (${responseTime}ms): ${errorMessage}`)
            return { endpoint: spec.path, status: 'FAIL', responseTime, error: errorMessage }
        }
    }

    private async testWithRetries(endpoint: string): Promise<TestResult> {
        let lastResult: TestResult | null = null

        for (let attempt = 1; attempt <= this.config.retries; attempt++) {
            if (attempt > 1) {
                console.log(`  🔄 Retry ${attempt}/${this.config.retries} for ${endpoint}`)
                await setTimeout(1000 * attempt) // Exponential backoff
            }

            lastResult = await this.makeRequest(endpoint)

            if (lastResult.status === 'PASS') {
                return lastResult
            }
        }

        return (
            lastResult ?? {
                endpoint,
                status: 'FAIL',
                error: 'No result after all retries',
            }
        )
    }

    async runSmokeTests(): Promise<boolean> {
        console.log('🚀 Starting smoke tests...')
        console.log(`   Base URL: ${this.config.baseUrl}`)
        console.log(`   Timeout: ${this.config.timeout}ms`)
        console.log(`   Retries: ${this.config.retries}`)
        if (this.config.token) console.log('   Auth: Bearer token provided')
        console.log('')

        // 1) Readiness first (retry until ready)
        const ready = await this.testWithRetries('/api/ready')
        this.results.push(ready)
        if (ready.status !== 'PASS') {
            // If not ready, no point continuing
            return this.reportResults()
        }

        // 2) Core public endpoints
        const publicSpecs: EndpointSpec[] = [
            { path: '/api/health', expect: 200, name: 'Health' },
            { path: '/docs/json', expect: 200, name: 'OpenAPI' },
            { path: '/api/v1/races', expect: 200, name: 'Races list' },
            { path: '/api/v1/skills', expect: 200, name: 'Skills list' },
            { path: '/api/v1/perks', expect: 200, name: 'Perks list' },
            { path: '/api/v1/archetypes', expect: 200, name: 'Archetypes list' },
            { path: '/api/v1/items', expect: 200, name: 'Items list' },
            { path: '/api/v1/tags', expect: 200, name: 'Tags list' },
            { path: '/api/v1/characters', expect: 200, name: 'Characters list' },
            { path: '/api/v1/images', expect: 200, name: 'Images list' },
        ]

        for (const spec of publicSpecs) {
            const result = await this.testWithRetries(spec.path)
            this.results.push(result)
        }

        // 3) Privileged endpoints (only when token provided)
        if (this.config.token) {
            const adminSpecs: EndpointSpec[] = [
                { path: '/api/v1/users', expect: 200, name: 'Users list', requiresAuth: true },
            ]
            for (const spec of adminSpecs) {
                // Use request() to include auth header and expected statuses
                let last: TestResult | null = null
                for (let attempt = 1; attempt <= this.config.retries; attempt++) {
                    if (attempt > 1) {
                        console.log(`  🔄 Retry ${attempt}/${this.config.retries} for ${spec.path}`)
                        await setTimeout(1000 * attempt)
                    }
                    last = await this.request(spec)
                    if (last.status === 'PASS') break
                }
                this.results.push(
                    last ?? { endpoint: spec.path, status: 'FAIL', error: 'No result' }
                )
            }
        }

        return this.reportResults()
    }

    private reportResults(): boolean {
        console.log('\n📊 Smoke Test Results:')
        console.log('='.repeat(50))

        const passed = this.results.filter(r => r.status === 'PASS')
        const failed = this.results.filter(r => r.status === 'FAIL')

        // Summary
        console.log(`✅ Passed: ${passed.length}/${this.results.length}`)
        console.log(`❌ Failed: ${failed.length}/${this.results.length}`)

        if (passed.length > 0) {
            console.log('\nPassing Tests:')
            passed.forEach(result => {
                console.log(
                    `  ✅ ${result.endpoint} (${result.statusCode}, ${result.responseTime}ms)`
                )
            })
        }

        if (failed.length > 0) {
            console.log('\nFailed Tests:')
            failed.forEach(result => {
                console.log(`  ❌ ${result.endpoint} - ${result.error}`)
            })
        }

        // Performance summary
        const avgResponseTime =
            this.results
                .filter(r => r.responseTime)
                .reduce((sum, r) => sum + (r.responseTime ?? 0), 0) / this.results.length

        console.log(`\n⏱️  Average Response Time: ${avgResponseTime.toFixed(0)}ms`)

        const allPassed = failed.length === 0

        if (allPassed) {
            console.log('\n🎉 All smoke tests passed!')
        } else {
            console.log('\n💥 Some smoke tests failed!')
        }

        return allPassed
    }
}

async function runSmokeTests(): Promise<void> {
    const baseUrl = process.env.SMOKE_TEST_URL ?? 'http://localhost:3000'
    const timeout = parseInt(process.env.SMOKE_TEST_TIMEOUT ?? '10000', 10)
    const retries = parseInt(process.env.SMOKE_TEST_RETRIES ?? '3', 10)
    const slowWarningMs = parseInt(process.env.SMOKE_TEST_SLOW_MS ?? '1000', 10)
    const token = process.env.SMOKE_TEST_TOKEN

    console.log('🔥 Fantasy Characters API - Smoke Test Runner')
    console.log('='.repeat(50))
    console.log(`🎯 Target: ${baseUrl}`)
    console.log(`⏰ Timeout: ${timeout}ms`)
    console.log(`🔄 Retries: ${retries}`)
    console.log('')

    const config: SmokeTestConfig = {
        baseUrl,
        timeout,
        retries,
        slowWarningMs,
        token,
    }

    const runner = new SmokeTestRunner(config)

    try {
        const success = await runner.runSmokeTests()
        if (success) {
            console.log('\n🚀 SUCCESS: All smoke tests passed!')
            console.log('✅ API is ready for production traffic')
            process.exitCode = 0
        } else {
            console.log('\n🚨 FAILURE: Some smoke tests failed!')
            console.log('❌ API is NOT ready for production traffic')
            process.exitCode = 1
        }
    } catch (error) {
        console.error('\n💥 CRITICAL ERROR: Smoke test runner failed!')
        console.error('Error details:', error)
        console.log('\n❌ Cannot determine API health status')
        process.exitCode = 1
    } finally {
        // Allow event loop to drain before exit on Windows
        await setTimeout(0)
    }
}

export { SmokeTestRunner, runSmokeTests }

async function startApiServer(): Promise<{ proc: ChildProcess; cleanup: () => Promise<void> }> {
    const cliJs = join(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.js')
    let proc: ChildProcess
    if (existsSync(cliJs)) {
        // Use Node to execute tsx CLI JS directly (works cross-platform with shell:false)
        proc = spawn(process.execPath, [cliJs, 'src/server.ts'], {
            shell: false,
            env: process.env,
            stdio: 'inherit',
        })
    } else {
        // Fallback: use tsx binary via shell (rare path; may show DEP0190)
        const tsxBin = process.platform === 'win32' ? 'tsx.cmd' : 'tsx'
        const command = `${tsxBin} src/server.ts`
        proc = spawn(command, { shell: true, env: process.env, stdio: 'inherit' })
    }

    const cleanup = async () => {
        if (proc.killed) return
        try {
            if (process.platform === 'win32') {
                // Kill the whole process tree on Windows to avoid orphaned node processes
                const command = `taskkill /PID ${proc.pid} /T /F`
                const killer = spawn(command, { shell: true, stdio: 'ignore' })
                await new Promise(resolve => killer.on('close', resolve))
            } else {
                proc.kill('SIGINT')
                await setTimeout(300)
                if (!proc.killed) proc.kill('SIGTERM')
            }
        } catch {
            // ignore
        }
    }

    // Small grace period; readiness probe will handle the rest
    await setTimeout(800)

    return { proc, cleanup }
}

async function main(): Promise<void> {
    const argv = new Set(process.argv.slice(2))
    const shouldStartServer = argv.has('--start') || process.env.SMOKE_START === '1'

    let cleanup: (() => Promise<void>) | null = null
    let serverExited = false
    let serverExitCode: number | null = null

    if (shouldStartServer) {
        console.log('🚀 Starting API server for smoke tests...')
        const { proc, cleanup: doCleanup } = await startApiServer()
        cleanup = doCleanup

        proc.on('exit', code => {
            serverExited = true
            serverExitCode = code === null ? 1 : code
        })

        // Graceful shutdown on signals
        const onSig = async (signal: string) => {
            console.log(`🔻 Received ${signal}, stopping API server...`)
            if (cleanup) await cleanup()
            process.exit(signal === 'SIGINT' ? 130 : 143)
        }
        process.on('SIGINT', () => void onSig('SIGINT'))
        process.on('SIGTERM', () => void onSig('SIGTERM'))

        if (serverExited && serverExitCode !== 0) {
            console.error('❌ API server failed to start. Aborting smoke tests.')
            if (cleanup) await cleanup()
            process.exit(1)
        }
    }

    await runSmokeTests()
    const code = typeof process.exitCode === 'number' ? process.exitCode : 1

    if (cleanup) await cleanup()
    process.exit(code)
}

// Execute when invoked directly (CLI)
if (process.argv[1]?.endsWith('smoke-tests.ts') || process.argv[1]?.endsWith('smoke-tests.js')) {
    void main().catch(err => {
        console.error('💥 smoke test CLI failed:', err)
        process.exit(1)
    })
}
