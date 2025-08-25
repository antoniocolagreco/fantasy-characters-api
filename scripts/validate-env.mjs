#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 *
 * This script validates all environment variables against the defined schema
 * and provides detailed feedback about missing or invalid configurations.
 */

/* eslint-env node */
/* global console */
/* global process */

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
}

const log = {
  info: msg => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: msg => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: msg => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  error: msg => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  header: msg => console.log(`\n${colors.bold}${colors.blue}🔧 ${msg}${colors.reset}`),
  detail: msg => console.log(`${colors.dim}   ${msg}${colors.reset}`),
}

// Environment variable definitions with validation rules
const environmentVariables = {
  NODE_ENV: {
    description: 'Application environment mode',
    required: false,
    default: 'development',
    validation: value => ['development', 'production', 'test'].includes(value),
    validationMessage: 'Must be one of: development, production, test',
  },
  PORT: {
    description: 'Server port number',
    required: false,
    default: '3000',
    validation: value => {
      const num = parseInt(value, 10)
      return !isNaN(num) && num >= 1 && num <= 65535
    },
    validationMessage: 'Must be a number between 1 and 65535',
  },
  HOST: {
    description: 'Server host address',
    required: false,
    default: '0.0.0.0',
    validation: value => value.length > 0,
    validationMessage: 'Must not be empty',
  },
  API_PREFIX: {
    description: 'API route prefix',
    required: false,
    default: '/api',
    validation: value => /^\/[a-zA-Z0-9/-]*$/.test(value),
    validationMessage: 'Must start with / and contain only alphanumeric characters, -, /',
  },
  API_VERSION: {
    description: 'API version identifier',
    required: false,
    default: 'v1',
    validation: value => /^v\d+$/.test(value),
    validationMessage: 'Must be in format v{number} (e.g., v1, v2)',
  },
  LOG_LEVEL: {
    description: 'Logging level',
    required: false,
    default: 'info',
    validation: value => ['fatal', 'error', 'warn', 'info', 'debug', 'trace'].includes(value),
    validationMessage: 'Must be one of: fatal, error, warn, info, debug, trace',
  },
  DATABASE_URL: {
    description: 'PostgreSQL connection string',
    required: true,
    validation: value => value.startsWith('postgresql://') && value.length > 15,
    validationMessage: 'Must be a valid PostgreSQL connection string',
  },
  JWT_SECRET: {
    description: 'JWT signing secret (minimum 32 characters)',
    required: true,
    validation: value => value.length >= 32,
    validationMessage: 'Must be at least 32 characters long',
    securityCheck: value =>
      !value.includes('dev-secret') && !value.includes('change-this') && !value.includes('your-'),
    securityMessage: 'Should not contain development placeholders',
  },
  JWT_EXPIRES_IN: {
    description: 'JWT expiration time (e.g., 15m, 1h, 7d)',
    required: false,
    default: '15m',
    validation: value => /^\d+[smhd]$/.test(value),
    validationMessage: 'Must be in format {number}{unit} where unit is s/m/h/d',
  },
  REFRESH_TOKEN_EXPIRES_IN: {
    description: 'Refresh token expiration time',
    required: false,
    default: '7d',
    validation: value => /^\d+[smhd]$/.test(value),
    validationMessage: 'Must be in format {number}{unit} where unit is s/m/h/d',
  },
  ARGON2_MEMORY_COST: {
    description: 'Argon2 memory cost in KB',
    required: false,
    default: '65536',
    validation: value => {
      const num = parseInt(value, 10)
      return !isNaN(num) && num >= 1024 && num <= 1048576
    },
    validationMessage: 'Must be a number between 1024 and 1048576 (1GB)',
  },
  ARGON2_TIME_COST: {
    description: 'Argon2 time cost (iterations)',
    required: false,
    default: '3',
    validation: value => {
      const num = parseInt(value, 10)
      return !isNaN(num) && num >= 1 && num <= 100
    },
    validationMessage: 'Must be a number between 1 and 100',
  },
  ARGON2_PARALLELISM: {
    description: 'Argon2 parallelism factor',
    required: false,
    default: '4',
    validation: value => {
      const num = parseInt(value, 10)
      return !isNaN(num) && num >= 1 && num <= 64
    },
    validationMessage: 'Must be a number between 1 and 64',
  },
  RATE_LIMIT_MAX: {
    description: 'Maximum requests per time window',
    required: false,
    default: '100',
    validation: value => {
      const num = parseInt(value, 10)
      return !isNaN(num) && num >= 1 && num <= 10000
    },
    validationMessage: 'Must be a number between 1 and 10000',
  },
  RATE_LIMIT_TIMEWINDOW: {
    description: 'Rate limit time window in milliseconds',
    required: false,
    default: '60000',
    validation: value => {
      const num = parseInt(value, 10)
      return !isNaN(num) && num >= 1000 && num <= 3600000
    },
    validationMessage: 'Must be a number between 1000 and 3600000 (1 hour)',
  },
  CORS_ORIGIN: {
    description: 'CORS allowed origins',
    required: false,
    default: 'http://localhost:3000',
    validation: value =>
      value === '*' ||
      value === 'true' ||
      value === 'false' ||
      /^https?:\/\/[\w.-]+(:\d+)?$/.test(value),
    validationMessage: 'Must be a valid URL, *, true, or false',
  },
  HEALTH_CHECK_ENABLED: {
    description: 'Enable health check endpoints',
    required: false,
    default: 'true',
    validation: value => ['true', 'false'].includes(value),
    validationMessage: 'Must be true or false',
  },
  CACHE_ENABLED: {
    description: 'Enable response caching',
    required: false,
    default: 'true',
    validation: value => ['true', 'false'].includes(value),
    validationMessage: 'Must be true or false',
  },
  CACHE_DEFAULT_TTL: {
    description: 'Default cache TTL in seconds',
    required: false,
    default: '300',
    validation: value => {
      const num = parseInt(value, 10)
      return !isNaN(num) && num >= 1 && num <= 86400
    },
    validationMessage: 'Must be a number between 1 and 86400 (24 hours)',
  },
  CACHE_MAX_ENTRIES: {
    description: 'Maximum cache entries',
    required: false,
    default: '1000',
    validation: value => {
      const num = parseInt(value, 10)
      return !isNaN(num) && num >= 1 && num <= 100000
    },
    validationMessage: 'Must be a number between 1 and 100000',
  },
  RBAC_ENABLED: {
    description: 'Enable Role-Based Access Control',
    required: false,
    default: 'false',
    validation: value => ['true', 'false'].includes(value),
    validationMessage: 'Must be true or false',
  },
  // Optional OAuth variables
  GOOGLE_CLIENT_ID: {
    description: 'Google OAuth client ID',
    required: false,
    validation: value => value.length > 0,
    validationMessage: 'Must not be empty if provided',
  },
  GOOGLE_CLIENT_SECRET: {
    description: 'Google OAuth client secret',
    required: false,
    validation: value => value.length > 0,
    validationMessage: 'Must not be empty if provided',
  },
  GITHUB_CLIENT_ID: {
    description: 'GitHub OAuth client ID',
    required: false,
    validation: value => value.length > 0,
    validationMessage: 'Must not be empty if provided',
  },
  GITHUB_CLIENT_SECRET: {
    description: 'GitHub OAuth client secret',
    required: false,
    validation: value => value.length > 0,
    validationMessage: 'Must not be empty if provided',
  },
  SESSION_SECRET: {
    description: 'Session encryption secret (minimum 32 characters)',
    required: false,
    validation: value => value.length >= 32,
    validationMessage: 'Must be at least 32 characters long if provided',
    securityCheck: value =>
      !value.includes('dev-secret') && !value.includes('change-this') && !value.includes('your-'),
    securityMessage: 'Should not contain development placeholders',
  },
}

function loadDotEnv() {
  const envPath = join(rootDir, '.env')
  if (!existsSync(envPath)) {
    return {}
  }

  try {
    const content = readFileSync(envPath, 'utf8')
    const env = {}

    content.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim()
        }
      }
    })

    return env
  } catch (error) {
    log.error(`Failed to read .env file: ${error.message}`)
    return {}
  }
}

function validateEnvironment() {
  log.header('Environment Variables Validation')

  const dotEnvVars = loadDotEnv()
  const envVars = { ...dotEnvVars, ...process.env }

  let hasErrors = false
  let hasWarnings = false
  const missingRequired = []
  const invalidValues = []
  const securityIssues = []
  const validVariables = []

  // Check each defined variable
  for (const [name, config] of Object.entries(environmentVariables)) {
    const value = envVars[name]
    const hasValue = value !== undefined && value !== ''

    if (config.required && !hasValue) {
      missingRequired.push({ name, config })
      hasErrors = true
    } else if (hasValue) {
      // Validate value format
      if (config.validation && !config.validation(value)) {
        invalidValues.push({ name, value, config })
        hasErrors = true
      } else {
        // Check security for sensitive variables
        if (config.securityCheck && !config.securityCheck(value)) {
          securityIssues.push({ name, value, config })
          hasWarnings = true
        }
        validVariables.push({
          name,
          value: value.length > 50 ? `${value.substring(0, 50)}...` : value,
        })
      }
    }
  }

  // Production-specific checks
  const nodeEnv = envVars.NODE_ENV || 'development'
  if (nodeEnv === 'production') {
    log.info('Running production environment checks...')

    // Check JWT_SECRET for production
    const jwtSecret = envVars.JWT_SECRET
    if (jwtSecret && jwtSecret.length < 64) {
      securityIssues.push({
        name: 'JWT_SECRET',
        value: 'Hidden',
        config: { securityMessage: 'Should be at least 64 characters in production' },
      })
      hasWarnings = true
    }

    // Check DATABASE_URL for production
    const dbUrl = envVars.DATABASE_URL
    if (dbUrl && (dbUrl.includes('localhost') || dbUrl.includes('developer:password'))) {
      securityIssues.push({
        name: 'DATABASE_URL',
        value: 'Hidden',
        config: { securityMessage: 'Should use production database credentials' },
      })
      hasWarnings = true
    }

    // Check RBAC is enabled
    if (envVars.RBAC_ENABLED === 'false') {
      securityIssues.push({
        name: 'RBAC_ENABLED',
        value: 'false',
        config: { securityMessage: 'Should be enabled (true) in production for security' },
      })
      hasWarnings = true
    }
  }

  // Report results
  if (validVariables.length > 0) {
    log.success(`${validVariables.length} environment variables are valid:`)
    validVariables.forEach(({ name, value }) => {
      log.detail(`${name}: ${value}`)
    })
  }

  if (missingRequired.length > 0) {
    log.error(`${missingRequired.length} required environment variables are missing:`)
    missingRequired.forEach(({ name, config }) => {
      log.detail(`${name}: ${config.description}`)
    })
  }

  if (invalidValues.length > 0) {
    log.error(`${invalidValues.length} environment variables have invalid values:`)
    invalidValues.forEach(({ name, value, config }) => {
      log.detail(`${name}: "${value}" - ${config.validationMessage}`)
    })
  }

  if (securityIssues.length > 0) {
    log.warning(`${securityIssues.length} security recommendations:`)
    securityIssues.forEach(({ name, value, config }) => {
      log.detail(
        `${name}: ${value === 'Hidden' ? 'Hidden' : `"${value}"`} - ${config.securityMessage}`,
      )
    })
  }

  // Check for unknown variables
  const knownVars = new Set(Object.keys(environmentVariables))
  const unknownVars = Object.keys(envVars).filter(
    key => !knownVars.has(key) && !key.startsWith('npm_'),
  )

  if (unknownVars.length > 0) {
    log.warning(`${unknownVars.length} unknown environment variables found:`)
    unknownVars.forEach(name => {
      log.detail(`${name}: ${envVars[name]}`)
    })
  }

  // Summary
  console.log()
  if (hasErrors) {
    log.error('Environment validation failed! Please fix the errors above.')
    return false
  } else if (hasWarnings) {
    log.warning(
      'Environment validation passed with warnings. Consider addressing the recommendations above.',
    )
    return true
  } else {
    log.success('Environment validation passed! All configurations are valid.')
    return true
  }
}

function showHelp() {
  log.header('Environment Variables Documentation')
  console.log()

  Object.entries(environmentVariables).forEach(([name, config]) => {
    console.log(`${colors.cyan}${name}${colors.reset}`)
    console.log(`  Description: ${config.description}`)
    console.log(`  Required: ${config.required ? 'Yes' : 'No'}`)
    if (config.default) {
      console.log(`  Default: ${config.default}`)
    }
    if (config.validationMessage) {
      console.log(`  Validation: ${config.validationMessage}`)
    }
    console.log()
  })
}

function main() {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h')) {
    showHelp()
    return
  }

  const isValid = validateEnvironment()
  process.exit(isValid ? 0 : 1)
}

main()
