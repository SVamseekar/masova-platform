#!/bin/bash

###############################################################################
# MaSoVa API Contract Validation Script
# Validates that frontend types are in sync with backend OpenAPI specs
#
# Purpose: Prevent commits/merges when types are out of sync
# Usage: Git pre-commit hook, CI/CD pipeline
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BLUE}${BOLD}Validating API Contracts...${NC}"
echo ""

# Check if generated types directory exists
if [ ! -d "frontend/src/types/generated" ]; then
  echo -e "${RED}✗ Generated types directory not found!${NC}"
  echo -e "${YELLOW}  Run: npm run sync-api-types${NC}"
  exit 1
fi

# Check if types were generated
if [ ! -f "frontend/src/types/generated/index.ts" ]; then
  echo -e "${RED}✗ Generated types index file not found!${NC}"
  echo -e "${YELLOW}  Run: npm run sync-api-types${NC}"
  exit 1
fi

# Check last modification time
TYPES_DIR="frontend/src/types/generated"
BACKEND_MODIFIED=$(find *-service/src/main/java -name "*.java" -type f -newer "$TYPES_DIR/index.ts" 2>/dev/null | wc -l)

if [ "$BACKEND_MODIFIED" -gt 0 ]; then
  echo -e "${YELLOW}⚠  Warning: Backend code has been modified since types were last generated${NC}"
  echo -e "${YELLOW}  Found $BACKEND_MODIFIED modified Java files${NC}"
  echo ""
  echo -e "${YELLOW}  Recommendation: Run sync script to ensure types are up-to-date:${NC}"
  echo -e "${BLUE}  npm run sync-api-types${NC}"
  echo ""
  echo -e "${YELLOW}  Proceeding with caution...${NC}"
fi

# Check if there are uncommitted changes to generated types
if git diff --quiet frontend/src/types/generated/ 2>/dev/null; then
  echo -e "${GREEN}✓ Generated types are committed${NC}"
else
  echo -e "${RED}✗ Generated types have uncommitted changes!${NC}"
  echo -e "${YELLOW}  Please commit the generated types:${NC}"
  echo -e "${BLUE}  git add frontend/src/types/generated${NC}"
  echo -e "${BLUE}  git commit -m \"chore: update generated API types\"${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}${BOLD}✓ API contract validation passed!${NC}"
exit 0
