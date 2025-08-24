#!/bin/bash

# Fantasy Character API - Unix Setup Script
# Run this script on Linux/macOS

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎮 Fantasy Character API - Unix Setup${NC}"
echo -e "${BLUE}====================================${NC}"

# Check prerequisites
echo -e "\n${YELLOW}🔍 Checking Prerequisites...${NC}"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    NODE_MAJOR=$(echo $NODE_VERSION | sed 's/v\([0-9]*\).*/\1/')
    if [ "$NODE_MAJOR" -ge 24 ]; then
        echo -e "${GREEN}✅ Node.js $NODE_VERSION found${NC}"
    else
        echo -e "${RED}❌ Node.js version $NODE_VERSION is too old. Need v24+${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Node.js not found. Please install Node.js v24+${NC}"
    exit 1
fi

# Check pnpm
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    echo -e "${GREEN}✅ pnpm $PNPM_VERSION found${NC}"
else
    echo -e "${YELLOW}❌ pnpm not found. Installing pnpm...${NC}"
    npm install -g pnpm
    echo -e "${GREEN}✅ pnpm installed${NC}"
fi

# Check Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✅ Docker found: $DOCKER_VERSION${NC}"
else
    echo -e "${RED}❌ Docker not found. Please install Docker${NC}"
    echo -e "${YELLOW}   Download from: https://docs.docker.com/get-docker/${NC}"
    exit 1
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    echo -e "${GREEN}✅ Docker Compose found: $COMPOSE_VERSION${NC}"
else
    echo -e "${RED}❌ Docker Compose not found${NC}"
    exit 1
fi

# Setup environment
echo -e "\n${YELLOW}🔧 Setting up Environment...${NC}"

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Created .env file from .env.example${NC}"
        echo -e "${YELLOW}⚠️  Please review .env file and update as needed${NC}"
    else
        echo -e "${RED}❌ .env.example not found!${NC}"
        exit 1
    fi
else
    echo -e "${CYAN}ℹ️  .env file already exists${NC}"
fi

# Install dependencies
echo -e "\n${YELLOW}📦 Installing Dependencies...${NC}"
if pnpm install; then
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# Start databases
echo -e "\n${YELLOW}🗄️  Starting Databases...${NC}"
if docker-compose up -d database database-test; then
    echo -e "${GREEN}✅ Database containers started${NC}"
else
    echo -e "${RED}❌ Failed to start database containers${NC}"
    exit 1
fi

# Wait for database
echo -e "\n${YELLOW}⏳ Waiting for database to be ready...${NC}"
retries=30
while [ $retries -gt 0 ]; do
    if docker-compose exec -T database pg_isready -U developer -d fantasy_character_api_dev >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Database is ready${NC}"
        break
    else
        retries=$((retries-1))
        if [ $retries -eq 0 ]; then
            echo -e "${RED}❌ Database failed to start within timeout${NC}"
            exit 1
        fi
        echo -n "."
        sleep 2
    fi
done

# Setup database schema and seed
echo -e "\n${YELLOW}🏗️  Setting up Database Schema...${NC}"
if npx prisma generate; then
    echo -e "${GREEN}✅ Prisma client generated${NC}"
else
    echo -e "${RED}❌ Failed to generate Prisma client${NC}"
    exit 1
fi

if npx prisma db push; then
    echo -e "${GREEN}✅ Database schema applied${NC}"
else
    echo -e "${RED}❌ Failed to apply database schema${NC}"
    exit 1
fi

if npx tsx prisma/seed.ts; then
    echo -e "${GREEN}✅ Database seeded with test data${NC}"
else
    echo -e "${RED}❌ Failed to seed database${NC}"
    exit 1
fi

# Run tests (optional)
echo -e "\n${YELLOW}🧪 Running Tests...${NC}"
if pnpm test; then
    echo -e "${GREEN}✅ Tests completed${NC}"
else
    echo -e "${YELLOW}⚠️  Some tests failed (this might be normal)${NC}"
fi

# Success message
echo -e "\n${GREEN}🎉 Setup Complete!${NC}"
echo -e "${GREEN}==================${NC}"
echo ""
echo "Next steps:"
echo "1. Review the .env file and update any configuration"
echo -e "2. Start development server: ${CYAN}pnpm dev${NC}"
echo -e "3. Open API docs: ${CYAN}http://localhost:3000/docs${NC}"
echo -e "4. Open Prisma Studio: ${CYAN}pnpm prisma:studio${NC}"
echo ""
echo "Test accounts:"
echo "• Admin: admin@fantasy-api.com / admin123"
echo "• Moderator: moderator@fantasy-api.com / mod123"
echo "• User: user@fantasy-api.com / user123"
echo "• Designer: designer@fantasy-api.com / design123"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
