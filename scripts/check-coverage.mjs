#!/usr/bin/env node
/* eslint-env node */
/* global console */
import fs from 'fs'
import process from 'node:process'
import path from 'path'

// Critical globs (simple substring match on path segments)
const CRITICAL_SEGMENTS = [
  `${path.sep}auth${path.sep}`,
  `${path.sep}shared${path.sep}rbac`,
  `${path.sep}shared${path.sep}rbac.service`,
  `${path.sep}shared${path.sep}auth`,
]

const MIN_CRITICAL = 90
const MIN_DEFAULT = 80

const summaryPath = path.resolve(process.cwd(), 'coverage', 'coverage-summary.json')
if (!fs.existsSync(summaryPath)) {
  console.error('Coverage summary not found at', summaryPath)
  process.exit(1)
}

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'))

// Vitest json-summary provides a map: filePath -> metrics (and a total key)
let failed = false
const failures = []

const isCritical = file => {
  const lower = file.toLowerCase()
  return CRITICAL_SEGMENTS.some(seg => lower.includes(seg))
}

for (const [file, metrics] of Object.entries(summary)) {
  if (file === 'total') continue
  if (!file.endsWith('.ts')) continue
  const critical = isCritical(file)
  const min = critical ? MIN_CRITICAL : MIN_DEFAULT
  const { lines, statements, functions, branches } = metrics
  const checks = {
    lines: lines.pct,
    statements: statements.pct,
    functions: functions.pct,
    branches: branches.pct,
  }
  for (const [k, v] of Object.entries(checks)) {
    if (v < min) {
      failed = true
      failures.push({ file, metric: k, value: v, required: min, critical })
    }
  }
}

if (failed) {
  console.error('\nCoverage enforcement failed:')
  for (const f of failures) {
    console.error(
      ` - ${f.file} :: ${f.metric} ${f.value}% < required ${f.required}% (${f.critical ? 'CRITICAL' : 'DEFAULT'})`,
    )
  }
  process.exit(2)
}

console.log('Coverage enforcement passed: all files meet required thresholds.')
