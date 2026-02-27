#!/bin/bash

###############################################################################
# Install Git Hooks for MaSoVa Project
# Sets up pre-commit hooks to validate API contracts
###############################################################################

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}Installing Git hooks for MaSoVa...${NC}"
echo ""

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# MaSoVa Pre-Commit Hook
# Validates API contracts before allowing commits

# Run API contract validation
if [ -f "./scripts/validate-api-contracts.sh" ]; then
  ./scripts/validate-api-contracts.sh
  if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Pre-commit hook failed: API contracts are out of sync"
    echo ""
    echo "To fix:"
    echo "  1. Run: npm run sync-api-types"
    echo "  2. Review and commit the generated types"
    echo "  3. Try committing again"
    echo ""
    echo "To skip this check (NOT recommended):"
    echo "  git commit --no-verify"
    echo ""
    exit 1
  fi
fi

exit 0
EOF

# Make hook executable
chmod +x .git/hooks/pre-commit

echo -e "${GREEN}✓ Installed pre-commit hook${NC}"
echo ""
echo -e "${YELLOW}The pre-commit hook will now:${NC}"
echo -e "  • Validate that generated API types are up-to-date"
echo -e "  • Prevent commits if types are out of sync"
echo -e "  • Ensure backend and frontend contracts match"
echo ""
echo -e "${BLUE}To bypass the hook (use sparingly):${NC}"
echo -e "  git commit --no-verify"
echo ""
echo -e "${GREEN}✓ Git hooks installed successfully!${NC}"
