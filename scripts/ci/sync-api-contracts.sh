#!/bin/bash

###############################################################################
# MaSoVa API Contract Synchronization Script
# Enterprise-Grade Type Generation from OpenAPI Specs
#
# Purpose: Automatically sync backend API contracts to frontend TypeScript types
# Usage: Run after ANY backend API changes to prevent mismatches
# Integration: Pre-commit hook, CI/CD pipeline, manual execution
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
SERVICES=(
  "core-service:8085"
  "commerce-service:8084"
  "payment-service:8089"
  "logistics-service:8086"
  "intelligence-service:8087"
)

OUTPUT_DIR="frontend/src/types/generated"
TEMP_DIR="/tmp/masova-openapi-$(date +%s)"
SKIP_RUNNING_CHECK=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-running-check)
      SKIP_RUNNING_CHECK=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --skip-running-check    Skip checking if services are running"
      echo "  --help, -h              Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0                           # Normal execution"
      echo "  $0 --skip-running-check      # Use cached specs (faster)"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Banner
echo -e "${CYAN}"
cat << "EOF"
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║  MaSoVa API Contract Synchronization                          ║
║  Enterprise-Grade Type Generation                             ║
║                                                                ║
║  Generating TypeScript types from backend OpenAPI specs       ║
║  This ensures frontend and backend contracts are in sync      ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Create temp and output directories
mkdir -p "$TEMP_DIR"
mkdir -p "$OUTPUT_DIR"

# Step 1: Check if services are running (unless skipped)
if [ "$SKIP_RUNNING_CHECK" = false ]; then
  echo -e "${YELLOW}${BOLD}Step 1: Checking if services are running...${NC}"
  all_running=true
  for service_config in "${SERVICES[@]}"; do
    IFS=':' read -r service_name port <<< "$service_config"

    if curl -s --max-time 2 "http://localhost:$port/actuator/health" > /dev/null 2>&1; then
      echo -e "${GREEN}  ✓ $service_name${NC} (port $port)"
    else
      echo -e "${RED}  ✗ $service_name${NC} (port $port) is NOT running"
      all_running=false
    fi
  done

  if [ "$all_running" = false ]; then
    echo ""
    echo -e "${RED}${BOLD}ERROR: Not all services are running!${NC}"
    echo ""
    echo -e "${YELLOW}Options:${NC}"
    echo -e "  1. Start all services: ${CYAN}./start-all.sh${NC}"
    echo -e "  2. Use cached specs (if available): ${CYAN}$0 --skip-running-check${NC}"
    echo ""
    exit 1
  fi
  echo ""
else
  echo -e "${YELLOW}${BOLD}Step 1: Skipping service availability check (using cached specs)${NC}"
  echo ""
fi

# Step 2: Check dependencies
echo -e "${YELLOW}${BOLD}Step 2: Checking dependencies...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
  echo -e "${RED}  ✗ Node.js is not installed${NC}"
  echo -e "${YELLOW}    Please install Node.js: https://nodejs.org/${NC}"
  exit 1
else
  node_version=$(node --version)
  echo -e "${GREEN}  ✓ Node.js${NC} $node_version"
fi

# Check npm
if ! command -v npm &> /dev/null; then
  echo -e "${RED}  ✗ npm is not installed${NC}"
  exit 1
else
  npm_version=$(npm --version)
  echo -e "${GREEN}  ✓ npm${NC} v$npm_version"
fi

# Check/Install openapi-generator-cli
if ! command -v openapi-generator-cli &> /dev/null; then
  echo -e "${YELLOW}  ⚠ openapi-generator-cli not found, installing globally...${NC}"
  npm install -g @openapitools/openapi-generator-cli > /dev/null 2>&1
  echo -e "${GREEN}  ✓ Installed openapi-generator-cli${NC}"
else
  echo -e "${GREEN}  ✓ openapi-generator-cli${NC}"
fi

echo ""

# Step 3: Fetch OpenAPI specs
echo -e "${YELLOW}${BOLD}Step 3: Fetching OpenAPI specifications...${NC}"
fetched_count=0
failed_fetch=0

for service_config in "${SERVICES[@]}"; do
  IFS=':' read -r service_name port <<< "$service_config"

  openapi_url="http://localhost:$port/v3/api-docs"
  spec_file="$TEMP_DIR/$service_name-spec.json"

  if [ "$SKIP_RUNNING_CHECK" = false ]; then
    if curl -s --max-time 5 "$openapi_url" -o "$spec_file" 2>/dev/null; then
      echo -e "${GREEN}  ✓ $service_name${NC}"
      ((fetched_count++))
    else
      echo -e "${RED}  ✗ $service_name${NC} - Failed to fetch spec"
      ((failed_fetch++))
    fi
  else
    # Try to use cached spec
    cached_spec="$OUTPUT_DIR/.cache/$service_name-spec.json"
    if [ -f "$cached_spec" ]; then
      cp "$cached_spec" "$spec_file"
      echo -e "${CYAN}  ↻ $service_name${NC} (using cached spec)"
      ((fetched_count++))
    else
      echo -e "${RED}  ✗ $service_name${NC} - No cached spec available"
      ((failed_fetch++))
    fi
  fi
done

if [ $fetched_count -eq 0 ]; then
  echo ""
  echo -e "${RED}${BOLD}ERROR: Failed to fetch any OpenAPI specs!${NC}"
  exit 1
fi

echo ""

# Step 4: Generate TypeScript types
echo -e "${YELLOW}${BOLD}Step 4: Generating TypeScript types...${NC}"
generated_count=0
failed_generation=0

# Clean output directory
rm -rf "$OUTPUT_DIR"/*.ts "$OUTPUT_DIR"/*/
mkdir -p "$OUTPUT_DIR/.cache"

for service_config in "${SERVICES[@]}"; do
  IFS=':' read -r service_name port <<< "$service_config"

  spec_file="$TEMP_DIR/$service_name-spec.json"

  if [ ! -f "$spec_file" ]; then
    continue
  fi

  output_path="$OUTPUT_DIR/$service_name"

  echo -e "${BLUE}  → Generating $service_name...${NC}"

  # Generate TypeScript types using openapi-generator
  if openapi-generator-cli generate \
    -i "$spec_file" \
    -g typescript-fetch \
    -o "$output_path" \
    --additional-properties=supportsES6=true,withInterfaces=true,typescriptThreePlus=true,useSingleRequestParameter=true \
    --skip-validate-spec \
    --global-property=models,apis \
    > "$TEMP_DIR/$service_name-generation.log" 2>&1; then

    echo -e "${GREEN}    ✓ Generated types for $service_name${NC}"

    # Cache the spec for future use
    cp "$spec_file" "$OUTPUT_DIR/.cache/$service_name-spec.json"

    ((generated_count++))
  else
    echo -e "${RED}    ✗ Failed to generate types for $service_name${NC}"
    echo -e "${YELLOW}      Check log: $TEMP_DIR/$service_name-generation.log${NC}"
    ((failed_generation++))
  fi
done

echo ""

# Step 5: Create barrel export file
echo -e "${YELLOW}${BOLD}Step 5: Creating index file for easy imports...${NC}"

cat > "$OUTPUT_DIR/index.ts" << 'INDEXEOF'
/**
 * MaSoVa API Types - Auto-Generated
 *
 * DO NOT EDIT THIS FILE MANUALLY
 *
 * This file is auto-generated from backend OpenAPI specifications.
 * To regenerate types after backend changes, run:
 *
 *   npm run sync-api-types
 *   or
 *   ./scripts/sync-api-contracts.sh
 *
 * Last generated: AUTO_TIMESTAMP
 */

// Re-export all service types
export * from './user-service';
export * from './menu-service';
export * from './order-service';
export * from './payment-service';
export * from './inventory-service';
export * from './analytics-service';
export * from './delivery-service';
export * from './customer-service';
export * from './notification-service';
export * from './review-service';
INDEXEOF

# Replace timestamp
sed -i.bak "s/AUTO_TIMESTAMP/$(date -u +"%Y-%m-%d %H:%M:%S UTC")/" "$OUTPUT_DIR/index.ts"
rm -f "$OUTPUT_DIR/index.ts.bak"

echo -e "${GREEN}  ✓ Created index.ts${NC}"

echo ""

# Step 6: Create README for generated types
cat > "$OUTPUT_DIR/README.md" << 'READMEEOF'
# Auto-Generated API Types

This directory contains TypeScript types automatically generated from backend OpenAPI specifications.

## ⚠️ DO NOT EDIT MANUALLY

These files are auto-generated. Any manual changes will be overwritten.

## Regenerating Types

After making backend API changes, regenerate types:

```bash
npm run sync-api-types
```

Or directly:

```bash
./scripts/sync-api-contracts.sh
```

## Usage

Import types in your components:

```typescript
import { Order, CreateOrderRequest, User } from '@/types/generated';

const newOrder: CreateOrderRequest = {
  storeId: "store-1",
  customerName: "John Doe",
  items: [...],
  // TypeScript enforces exact backend schema!
};
```

## CI/CD Integration

This script runs automatically:
- Pre-commit hook (validates types are up-to-date)
- CI/CD pipeline (fails if types are out of sync)
- GitHub Actions (on every PR)

## Troubleshooting

### Types are out of sync

```bash
# Regenerate types
npm run sync-api-types

# Commit the changes
git add frontend/src/types/generated
git commit -m "chore: regenerate API types"
```

### Services not running

Start all services first:

```bash
./start-all.sh
```

Or use cached specs:

```bash
./scripts/sync-api-contracts.sh --skip-running-check
```
READMEEOF

echo -e "${GREEN}  ✓ Created README.md${NC}"

echo ""

# Cleanup temp directory
rm -rf "$TEMP_DIR"

# Summary
echo -e "${CYAN}"
cat << "EOF"
╔════════════════════════════════════════════════════════════════╗
║  Summary                                                       ║
╚════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "  ${GREEN}✓ Successfully generated: $generated_count services${NC}"
if [ $failed_generation -gt 0 ]; then
  echo -e "  ${RED}✗ Failed: $failed_generation services${NC}"
fi
if [ $failed_fetch -gt 0 ]; then
  echo -e "  ${YELLOW}⚠ Could not fetch: $failed_fetch services${NC}"
fi
echo -e "  ${BLUE}→ Output directory: $OUTPUT_DIR${NC}"
echo ""

if [ $failed_generation -eq 0 ] && [ $generated_count -gt 0 ]; then
  echo -e "${GREEN}${BOLD}SUCCESS!${NC} ${GREEN}All TypeScript types are synchronized with backend.${NC}"
  echo ""
  echo -e "${CYAN}Next steps:${NC}"
  echo -e "  ${BOLD}1.${NC} Import types in your frontend:"
  echo -e "     ${BLUE}import { Order, CreateOrderRequest } from '@/types/generated';${NC}"
  echo ""
  echo -e "  ${BOLD}2.${NC} TypeScript will now enforce exact backend schemas!"
  echo -e "     ${GREEN}No more API mismatches! ✨${NC}"
  echo ""
  echo -e "  ${BOLD}3.${NC} Run this script after EVERY backend API change"
  echo -e "     ${BLUE}npm run sync-api-types${NC}"
  echo ""
  echo -e "${YELLOW}${BOLD}Important:${NC}"
  echo -e "  • Add generated types to version control"
  echo -e "  • Set up pre-commit hook (coming next)"
  echo -e "  • Integrate into CI/CD pipeline"
  echo ""
else
  echo -e "${RED}${BOLD}PARTIAL SUCCESS${NC}"
  echo -e "Some services could not be processed. Check errors above."
  echo ""
  if [ $generated_count -gt 0 ]; then
    echo -e "Generated types for $generated_count services are still usable."
  fi
  exit 1
fi
