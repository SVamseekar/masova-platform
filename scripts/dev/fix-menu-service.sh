#!/bin/bash

echo "=================================="
echo "MaSoVa Menu Service Fix Script"
echo "=================================="
echo

# Step 1: Rebuild menu-service
echo "Step 1: Rebuilding menu-service..."
cd menu-service
mvn clean install -DskipTests
if [ $? -ne 0 ]; then
    echo "❌ Build failed! Check errors above."
    exit 1
fi
echo "✅ Build successful"
echo

# Step 2: Clear Redis cache
echo "Step 2: Clearing Redis cache..."
redis-cli FLUSHALL
echo "✅ Redis cache cleared"
echo

# Step 3: Verify MongoDB data
echo "Step 3: Verifying MongoDB menu data..."
MENU_COUNT=$(mongosh MaSoVa --quiet --eval "db.menu_items.countDocuments()")
echo "   Found $MENU_COUNT menu items in database"
echo

# Step 4: Instructions
echo "=================================="
echo "✅ Pre-flight checks complete!"
echo "=================================="
echo
echo "NEXT STEPS:"
echo "1. Restart the menu-service (port 8082)"
echo "2. Restart the api-gateway (port 8080)"
echo "3. Test with: curl http://localhost:8080/api/menu/items"
echo
echo "=================================="
