#!/usr/bin/env node

/**
 * Project Setup Script
 *
 * This script automates the setup process for new developers.
 * It checks prerequisites, sets up the environment, and runs initial setup tasks.
 */

/* eslint-env node */
/* global console */
/* global process */

import { execSync } from 'child_process'
import { copyFileSync, existsSync } from 'fs'

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
}

const log = {
  info: msg => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: msg => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: msg => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  error: msg => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  header: msg => console.log(`\n${colors.bold}${colors.blue}🚀 ${msg}${colors.reset}`),
}

function run(command, description) {
  try {
    log.info(`${description}...`)
    execSync(command, { stdio: 'inherit', cwd: process.cwd() })
    log.success(`${description} completed`)
    return true
  } catch (error) {
    log.error(`${description} failed: ${error.message}`)
    return false
  }
}

function checkPrerequisites() {
  log.header('Checking Prerequisites')

  const checks = [
    {
      command: 'node --version',
      name: 'Node.js (>=24.0.0)',
      check: output => {
        const version = output.trim().substring(1)
        const major = parseInt(version.split('.')[0])
        return major >= 24
      },
    },
    {
      command: 'pnpm --version',
      name: 'pnpm (>=9.0.0)',
      check: output => {
        const version = output.trim()
        const major = parseInt(version.split('.')[0])
        return major >= 9
      },
    },
    {
      command: 'docker --version',
      name: 'Docker',
      check: () => true,
    },
    {
      command: 'docker-compose --version',
      name: 'Docker Compose',
      check: () => true,
    },
  ]

  let allChecksPass = true

  for (const check of checks) {
    try {
      const output = execSync(check.command, { encoding: 'utf8', stdio: 'pipe' })
      if (check.check(output)) {
        log.success(`${check.name} is available`)
      } else {
        log.error(`${check.name} version requirement not met`)
        allChecksPass = false
      }
    } catch {
      log.error(`${check.name} is not available`)
      allChecksPass = false
    }
  }

  return allChecksPass
}

function setupEnvironment() {
  log.header('Setting up Environment')

  if (!existsSync('.env')) {
    if (existsSync('.env.example')) {
      copyFileSync('.env.example', '.env')
      log.success('Created .env file from .env.example')
      log.warning('Please review and update .env file with your specific configuration')
    } else {
      log.error('.env.example file not found!')
      return false
    }
  } else {
    log.info('.env file already exists')
  }

  return true
}

function setupDatabase() {
  log.header('Setting up Database')

  // Start database containers
  if (!run('docker-compose up -d database database-test', 'Starting PostgreSQL containers')) {
    return false
  }

  // Wait for database to be ready
  log.info('Waiting for database to be ready...')
  let retries = 30
  while (retries > 0) {
    try {
      execSync(
        'docker-compose exec -T database pg_isready -U developer -d fantasy_character_api_dev',
        { stdio: 'pipe' },
      )
      log.success('Database is ready')
      break
    } catch {
      retries--
      if (retries === 0) {
        log.error('Database failed to start within timeout')
        return false
      }
      // Wait 2 seconds before retry
      execSync('sleep 2', { stdio: 'pipe' })
    }
  }

  // Generate Prisma client
  if (!run('npx prisma generate', 'Generating Prisma client')) {
    return false
  }

  // Push database schema
  if (!run('npx prisma db push', 'Setting up database schema')) {
    return false
  }

  // Seed database
  if (!run('npx tsx prisma/seed.ts', 'Seeding database with initial data')) {
    return false
  }

  return true
}

function runTests() {
  log.header('Running Tests')

  if (!run('pnpm test', 'Running test suite')) {
    log.warning('Some tests failed. This might be normal during initial setup.')
    return true // Don't fail setup for test failures
  }

  return true
}

function main() {
  console.log(`${colors.bold}${colors.blue}
🎮 Fantasy Character API - Project Setup
=========================================${colors.reset}

This script will set up the project for development.
`)

  // Check prerequisites
  if (!checkPrerequisites()) {
    log.error('Prerequisites check failed. Please install missing requirements.')
    process.exit(1)
  }

  // Setup environment
  if (!setupEnvironment()) {
    log.error('Environment setup failed.')
    process.exit(1)
  }

  // Install dependencies
  log.header('Installing Dependencies')
  if (!run('pnpm install', 'Installing Node.js dependencies')) {
    log.error('Dependency installation failed.')
    process.exit(1)
  }

  // Setup database
  if (!setupDatabase()) {
    log.error('Database setup failed.')
    process.exit(1)
  }

  // Run tests
  runTests()

  // Final message
  log.header('Setup Complete!')
  console.log(`
${colors.green}✅ Project setup completed successfully!${colors.reset}

${colors.bold}Next steps:${colors.reset}
1. Review the .env file and update any configuration as needed
2. Start the development server: ${colors.blue}pnpm dev${colors.reset}
3. Visit API documentation: ${colors.blue}http://localhost:3000/docs${colors.reset}
4. Visit Prisma Studio: ${colors.blue}pnpm prisma:studio${colors.reset}

${colors.bold}Test accounts available:${colors.reset}
• Admin: admin@fantasy-api.com / admin123
• Moderator: moderator@fantasy-api.com / mod123
• User: user@fantasy-api.com / user123
• Designer: designer@fantasy-api.com / design123

${colors.bold}Useful commands:${colors.reset}
• ${colors.blue}pnpm dev${colors.reset}                 - Start development server
• ${colors.blue}pnpm test${colors.reset}                - Run tests
• ${colors.blue}pnpm test:watch${colors.reset}          - Run tests in watch mode
• ${colors.blue}pnpm prisma:studio${colors.reset}       - Open database browser
• ${colors.blue}pnpm docker:logs${colors.reset}         - View Docker logs
• ${colors.blue}pnpm db:reset${colors.reset}           - Reset and reseed database

Happy coding! 🚀
`)
}

main()
