#!/bin/bash

# Script to update all frontend API files to use API Gateway

BASE_DIR="/Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system/frontend/src/store/api"

echo "🔄 Updating frontend API files to use API Gateway..."
echo "================================================="

# Update each API file to use localhost:8080/api instead of direct service URLs
find "$BASE_DIR" -name "*.ts" -type f | while read -r file; do
    filename=$(basename "$file")
    echo "Processing $filename..."

    # Replace direct service URLs with API Gateway
    sed -i '' 's|http://localhost:8081|http://localhost:8080/api|g' "$file"
    sed -i '' 's|http://localhost:8082|http://localhost:8080/api|g' "$file"
    sed -i '' 's|http://localhost:8083|http://localhost:8080/api|g' "$file"
    sed -i '' 's|http://localhost:8085|http://localhost:8080/api|g' "$file"
    sed -i '' 's|http://localhost:8086|http://localhost:8080/api|g' "$file"
    sed -i '' 's|http://localhost:8088|http://localhost:8080/api|g' "$file"
    sed -i '' 's|http://localhost:8089|http://localhost:8080/api|g' "$file"
    sed -i '' 's|http://localhost:8090|http://localhost:8080/api|g' "$file"
    sed -i '' 's|http://localhost:8091|http://localhost:8080/api|g' "$file"
    sed -i '' 's|http://localhost:8092|http://localhost:8080/api|g' "$file"

    echo "  ✓ Updated $filename"
done

echo ""
echo "================================================="
echo "✅ All frontend API files updated to use API Gateway!"
echo ""
echo "Next steps:"
echo "  1. Review changes: git diff frontend/src/store/api/"
echo "  2. Test authentication flow"
echo "  3. Rebuild services with: mvn clean install -DskipTests"
