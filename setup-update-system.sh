#!/bin/bash

################################################################################
# MaSoVa Update System - First Time Setup Script
#
# This script helps you configure the update system for the first time
################################################################################

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   MaSoVa Update System - First Time Setup     ${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check if .masova-config exists
if [ ! -f ".masova-config" ]; then
    echo -e "${RED}❌ .masova-config file not found${NC}"
    echo "This file should have been created. Please check your installation."
    exit 1
fi

# Prompt for Docker Hub username
echo -e "${YELLOW}Step 1: Docker Hub Configuration${NC}"
echo "────────────────────────────────────────────────────────"
echo ""
echo "If you don't have a Docker Hub account yet:"
echo "  1. Go to: https://hub.docker.com/signup"
echo "  2. Create a FREE account"
echo "  3. Verify your email"
echo ""
read -p "Enter your Docker Hub username: " DOCKER_USERNAME

if [ -z "$DOCKER_USERNAME" ]; then
    echo -e "${RED}❌ Docker Hub username cannot be empty${NC}"
    exit 1
fi

# Prompt for GitHub username
echo ""
echo -e "${YELLOW}Step 2: GitHub Configuration${NC}"
echo "────────────────────────────────────────────────────────"
echo ""
read -p "Enter your GitHub username: " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    echo -e "${RED}❌ GitHub username cannot be empty${NC}"
    exit 1
fi

# Update .masova-config
echo ""
echo -e "${YELLOW}Updating configuration...${NC}"

# Create backup
cp .masova-config .masova-config.backup

# Update Docker Hub username
sed -i.tmp "s/DOCKER_HUB_USERNAME=YOUR_DOCKERHUB_USERNAME/DOCKER_HUB_USERNAME=$DOCKER_USERNAME/g" .masova-config

# Update GitHub username
sed -i.tmp "s/GITHUB_USERNAME=YOUR_GITHUB_USERNAME/GITHUB_USERNAME=$GITHUB_USERNAME/g" .masova-config

# Clean up temp files
rm -f .masova-config.tmp

echo -e "${GREEN}✅ Configuration updated successfully!${NC}"
echo ""

# Show what was configured
echo "Configuration:"
echo "  Docker Hub: $DOCKER_USERNAME"
echo "  GitHub: $GITHUB_USERNAME"
echo ""

# Test Maven and Java
echo -e "${YELLOW}Step 3: Checking Prerequisites${NC}"
echo "────────────────────────────────────────────────────────"
echo ""

if ! command -v java &> /dev/null; then
    echo -e "${RED}❌ Java not found${NC}"
    echo "Please install Java 17 or higher"
    HAS_ERROR=true
else
    JAVA_VERSION=$(java -version 2>&1 | head -n 1)
    echo -e "${GREEN}✅ Java: $JAVA_VERSION${NC}"
fi

if ! command -v mvn &> /dev/null; then
    echo -e "${RED}❌ Maven not found${NC}"
    echo "Please install Maven"
    HAS_ERROR=true
else
    MVN_VERSION=$(mvn --version | head -n 1)
    echo -e "${GREEN}✅ Maven: $MVN_VERSION${NC}"
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found${NC}"
    echo "Please install Docker Desktop"
    HAS_ERROR=true
else
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✅ Docker: $DOCKER_VERSION${NC}"
fi

if [ "$HAS_ERROR" = true ]; then
    echo ""
    echo -e "${RED}Please install missing prerequisites before continuing${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}All prerequisites installed!${NC}"

# Next steps
echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}   Setup Complete! 🎉${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo "Next Steps:"
echo ""
echo "1. Test the build:"
echo "   ${YELLOW}./build-monolith.sh --skip-tests --version=1.0.0${NC}"
echo ""
echo "2. Add GitHub Secrets:"
echo "   - Go to: https://github.com/$GITHUB_USERNAME/masova/settings/secrets/actions"
echo "   - Add secret: DOCKER_USERNAME = $DOCKER_USERNAME"
echo "   - Add secret: DOCKER_PASSWORD = (your Docker Hub password/token)"
echo ""
echo "3. Create your first release:"
echo "   ${YELLOW}git add ."
echo "   git commit -m 'Setup update system'"
echo "   git push"
echo "   git tag v1.0.0"
echo "   git push origin v1.0.0${NC}"
echo ""
echo "For detailed instructions, see: ${BLUE}SETUP-INSTRUCTIONS.md${NC}"
echo ""
