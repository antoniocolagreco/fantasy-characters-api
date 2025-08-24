# Fantasy Character API - Windows Setup Script
# Run this script in PowerShell as Administrator if needed

Write-Host "🎮 Fantasy Character API - Windows Setup" -ForegroundColor Blue
Write-Host "====================================" -ForegroundColor Blue

# Check prerequisites
Write-Host "`n🔍 Checking Prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
  $nodeVersion = node --version
  $nodeMajor = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
  if ($nodeMajor -ge 24) {
    Write-Host "✅ Node.js $nodeVersion found" -ForegroundColor Green
  }
  else {
    Write-Host "❌ Node.js version $nodeVersion is too old. Need v24+" -ForegroundColor Red
    exit 1
  }
}
catch {
  Write-Host "❌ Node.js not found. Please install Node.js v24+" -ForegroundColor Red
  exit 1
}

# Check pnpm
try {
  $pnpmVersion = pnpm --version
  Write-Host "✅ pnpm $pnpmVersion found" -ForegroundColor Green
}
catch {
  Write-Host "❌ pnpm not found. Installing pnpm..." -ForegroundColor Yellow
  npm install -g pnpm
  Write-Host "✅ pnpm installed" -ForegroundColor Green
}

# Check Docker
try {
  $dockerVersion = docker --version
  Write-Host "✅ Docker found: $dockerVersion" -ForegroundColor Green
}
catch {
  Write-Host "❌ Docker not found. Please install Docker Desktop" -ForegroundColor Red
  Write-Host "   Download from: https://docs.docker.com/desktop/install/windows/" -ForegroundColor Yellow
  exit 1
}

# Check Docker Compose
try {
  $composeVersion = docker-compose --version
  Write-Host "✅ Docker Compose found: $composeVersion" -ForegroundColor Green
}
catch {
  Write-Host "❌ Docker Compose not found" -ForegroundColor Red
  exit 1
}

# Setup environment
Write-Host "`n🔧 Setting up Environment..." -ForegroundColor Yellow

if (!(Test-Path ".env")) {
  if (Test-Path ".env.example") {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file from .env.example" -ForegroundColor Green
    Write-Host "⚠️  Please review .env file and update as needed" -ForegroundColor Yellow
  }
  else {
    Write-Host "❌ .env.example not found!" -ForegroundColor Red
    exit 1
  }
}
else {
  Write-Host "ℹ️  .env file already exists" -ForegroundColor Cyan
}

# Install dependencies
Write-Host "`n📦 Installing Dependencies..." -ForegroundColor Yellow
try {
  pnpm install
  Write-Host "✅ Dependencies installed" -ForegroundColor Green
}
catch {
  Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
  exit 1
}

# Start databases
Write-Host "`n🗄️  Starting Databases..." -ForegroundColor Yellow
try {
  docker-compose up -d database database-test
  Write-Host "✅ Database containers started" -ForegroundColor Green
}
catch {
  Write-Host "❌ Failed to start database containers" -ForegroundColor Red
  exit 1
}

# Wait for database
Write-Host "`n⏳ Waiting for database to be ready..." -ForegroundColor Yellow
$retries = 30
do {
  try {
    docker-compose exec -T database pg_isready -U developer -d fantasy_character_api_dev | Out-Null
    Write-Host "✅ Database is ready" -ForegroundColor Green
    break
  }
  catch {
    $retries--
    if ($retries -eq 0) {
      Write-Host "❌ Database failed to start within timeout" -ForegroundColor Red
      exit 1
    }
    Start-Sleep -Seconds 2
    Write-Host "." -NoNewline -ForegroundColor Yellow
  }
} while ($retries -gt 0)

# Setup database schema and seed
Write-Host "`n🏗️  Setting up Database Schema..." -ForegroundColor Yellow
try {
  npx prisma generate
  Write-Host "✅ Prisma client generated" -ForegroundColor Green
    
  npx prisma db push
  Write-Host "✅ Database schema applied" -ForegroundColor Green
    
  npx tsx prisma/seed.ts
  Write-Host "✅ Database seeded with test data" -ForegroundColor Green
}
catch {
  Write-Host "❌ Database setup failed" -ForegroundColor Red
  exit 1
}

# Run tests (optional)
Write-Host "`n🧪 Running Tests..." -ForegroundColor Yellow
try {
  pnpm test
  Write-Host "✅ Tests completed" -ForegroundColor Green
}
catch {
  Write-Host "⚠️  Some tests failed (this might be normal)" -ForegroundColor Yellow
}

# Success message
Write-Host "`n🎉 Setup Complete!" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. Review the .env file and update any configuration" -ForegroundColor White
Write-Host "2. Start development server: " -NoNewline -ForegroundColor White
Write-Host "pnpm dev" -ForegroundColor Cyan
Write-Host "3. Open API docs: " -NoNewline -ForegroundColor White
Write-Host "http://localhost:3000/docs" -ForegroundColor Cyan
Write-Host "4. Open Prisma Studio: " -NoNewline -ForegroundColor White
Write-Host "pnpm prisma:studio" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test accounts:" -ForegroundColor White
Write-Host "• Admin: admin@fantasy-api.com / admin123" -ForegroundColor Gray
Write-Host "• Moderator: moderator@fantasy-api.com / mod123" -ForegroundColor Gray
Write-Host "• User: user@fantasy-api.com / user123" -ForegroundColor Gray
Write-Host "• Designer: designer@fantasy-api.com / design123" -ForegroundColor Gray
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Green
