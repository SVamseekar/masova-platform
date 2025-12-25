#!/bin/bash

# Generate PINs for the 2 employees in DOM001
# This script calls the user-service API to generate PINs

USER_SERVICE_URL="http://localhost:8081"

echo "🔑 Generating PINs for DOM001 employees..."
echo "=========================================="

# Employee IDs
RAJESH_ID="693d6a6b3cb3e12550ff64d5"
SURESH_ID="692b3adf0b7ca211769b0153"

echo ""
echo "📍 Employee 1: Rajesh Kumar (Driver)"
curl -X POST "${USER_SERVICE_URL}/api/users/${RAJESH_ID}/generate-pin?storeId=DOM001" \
  -H "Content-Type: application/json" \
  2>/dev/null | python3 -m json.tool || echo "❌ Failed to generate PIN for Rajesh"

echo ""
echo "=========================================="
echo "📍 Employee 2: Suresh Kumar (Manager)"
curl -X POST "${USER_SERVICE_URL}/api/users/${SURESH_ID}/generate-pin?storeId=DOM001" \
  -H "Content-Type: application/json" \
  2>/dev/null | python3 -m json.tool || echo "❌ Failed to generate PIN for Suresh"

echo ""
echo "=========================================="
echo "✅ PIN generation complete!"
echo ""
echo "⚠️  IMPORTANT: Save the PINs above - they cannot be recovered!"
echo "⚠️  Distribute the PINs to the employees securely."
