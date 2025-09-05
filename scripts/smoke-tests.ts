#!/usr/bin/env tsx

/**
 * Smoke test script for deployment validation
 * Tests basic API functionality after deployment
 */

import { setTimeout } from 'timers/promises'

interface SmokeTestConfig {
    baseUrl: string
    timeout: number
    retries: number
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
        console.log('')

        const testEndpoints = [
            '/api/health',
            '/api/ready',
            '/docs/json', // OpenAPI schema
        ]

        // Run tests sequentially
        for (const endpoint of testEndpoints) {
            const result = await this.testWithRetries(endpoint)
            this.results.push(result)
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

// Run smoke tests if called directly
if (process.argv[1]?.endsWith('smoke-tests.ts') || process.argv[1]?.endsWith('smoke-tests.js')) {
    runSmokeTests().catch(error => {
        console.error('💥 Fatal error:', error)
        process.exitCode = 1
    })
}

export { SmokeTestRunner, runSmokeTests }
