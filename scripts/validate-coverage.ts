#!/usr/bin/env tsx
/*
Validate per-file coverage against thresholds and list offenders.
Usage:
  pnpm test:coverage && pnpm validate:coverage
Env overrides:
  COVERAGE_MIN_STMTS, COVERAGE_MIN_FUNCS, COVERAGE_MIN_LINES, COVERAGE_MIN_BRANCHES
Args (optional):
  --file=<path-to-coverage-final.json>
*/

import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

// Thresholds (defaults aligned with vitest.config.ts)
const MIN_STMTS = Number(process.env.COVERAGE_MIN_STMTS ?? 80)
const MIN_FUNCS = Number(process.env.COVERAGE_MIN_FUNCS ?? 80)
const MIN_LINES = Number(process.env.COVERAGE_MIN_LINES ?? 80)
const MIN_BRANCHES = Number(process.env.COVERAGE_MIN_BRANCHES ?? 60)

// CLI arg: --file=...
const argFile = process.argv.find(a => a.startsWith('--file='))?.split('=')[1]
const COVERAGE_FILE = resolve(argFile ?? 'coverage/coverage-final.json')

if (!existsSync(COVERAGE_FILE)) {
    console.error(`Coverage file not found: ${COVERAGE_FILE}`)
    console.error('Run tests with coverage first:')
    console.error('  pnpm test:coverage')
    process.exit(1)
}

// Types compatible with Istanbul coverage JSON
type CoverageFile = {
    path?: string
    s: Record<string, number>
    f: Record<string, number>
    b: Record<string, number[]>
    l?: Record<string, number>
}

// Load coverage json
const raw = readFileSync(COVERAGE_FILE, 'utf-8')
const data = JSON.parse(raw) as Record<string, CoverageFile>

function pct(covered: number, total: number): number {
    if (total === 0) return 100
    return +(100 * (covered / total)).toFixed(2)
}

function calcStatements(file: CoverageFile): { covered: number; total: number; pct: number } {
    const counts = Object.values(file.s)
    const total = counts.length
    const covered = counts.filter(c => c > 0).length
    return { covered, total, pct: pct(covered, total) }
}

function calcFunctions(file: CoverageFile): { covered: number; total: number; pct: number } {
    const counts = Object.values(file.f)
    const total = counts.length
    const covered = counts.filter(c => c > 0).length
    return { covered, total, pct: pct(covered, total) }
}

function calcBranches(file: CoverageFile): { covered: number; total: number; pct: number } {
    const branches = Object.values(file.b)
    const total = branches.reduce((acc, arr) => acc + arr.length, 0)
    const covered = branches.reduce((acc, arr) => acc + arr.filter(c => c > 0).length, 0)
    return { covered, total, pct: pct(covered, total) }
}

function calcLines(file: CoverageFile): { covered: number; total: number; pct: number } {
    // Prefer line map if present, else approximate using statements
    if (file.l) {
        const counts = Object.values(file.l)
        const total = counts.length
        const covered = counts.filter(c => c > 0).length
        return { covered, total, pct: pct(covered, total) }
    }
    return calcStatements(file)
}

// Only consider app source files
function isSrcFile(fp: string): boolean {
    const norm = fp.replace(/\\/g, '/').toLowerCase()
    return norm.includes('/src/')
}

const offenders: Array<{
    file: string
    stmts: number
    funcs: number
    lines: number
    branches: number
}> = []

for (const [filePath, file] of Object.entries(data)) {
    if (!isSrcFile(filePath)) continue

    const s = calcStatements(file)
    const f = calcFunctions(file)
    const l = calcLines(file)
    const b = calcBranches(file)

    const fail = s.pct < MIN_STMTS || f.pct < MIN_FUNCS || l.pct < MIN_LINES || b.pct < MIN_BRANCHES
    if (fail) {
        offenders.push({
            file: filePath,
            stmts: s.pct,
            funcs: f.pct,
            lines: l.pct,
            branches: b.pct,
        })
    }
}

if (offenders.length === 0) {
    console.log('✅ PASS: All files meet coverage thresholds.')
    console.log(
        `Thresholds -> statements: ${MIN_STMTS}%, functions: ${MIN_FUNCS}%, lines: ${MIN_LINES}%, branches: ${MIN_BRANCHES}%`
    )
    process.exit(0)
}

// Sort by worst statements first, then lines, funcs, branches
offenders.sort((a, b) =>
    a.stmts !== b.stmts
        ? a.stmts - b.stmts
        : a.lines !== b.lines
          ? a.lines - b.lines
          : a.funcs !== b.funcs
            ? a.funcs - b.funcs
            : a.branches - b.branches
)

console.error('❌ FAIL: Some files are below coverage thresholds:')
console.error(
    `Thresholds -> statements: ${MIN_STMTS}%, functions: ${MIN_FUNCS}%, lines: ${MIN_LINES}%, branches: ${MIN_BRANCHES}%`
)
for (const o of offenders) {
    const rel = o.file.replace(process.cwd().replace(/\\/g, '/'), '').replace(/^[/\\]/, '')
    console.error(
        `- ${rel}  (stmts: ${o.stmts}%, lines: ${o.lines}%, funcs: ${o.funcs}%, branches: ${o.branches}%)`
    )
}
process.exit(1)
