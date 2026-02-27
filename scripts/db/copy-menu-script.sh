#!/bin/bash

# MaSoVa Menu Copy Script
# This script copies menu items from one store to another

echo "======================================"
echo "MaSoVa Menu Copy Tool"
echo "======================================"
echo

# First, we need to get the store IDs
echo "Step 1: Getting store IDs..."
echo "Please provide the following information:"
echo

read -p "Enter source store ID (MaSoVa Main Branch): " SOURCE_STORE_ID
read -p "Enter target store ID (Banjara Hills): " TARGET_STORE_ID

# API endpoint
API_URL="http://localhost:8081/api/menu/copy-menu"

echo
echo "======================================"
echo "Summary:"
echo "  Source Store: $SOURCE_STORE_ID"
echo "  Target Store: $TARGET_STORE_ID"
echo "  API Endpoint: $API_URL"
echo "======================================"
echo

read -p "Proceed with menu copy? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "Operation cancelled."
    exit 0
fi

echo
echo "Copying menu items..."
echo

# Make the API call
RESPONSE=$(curl -s -X POST "$API_URL?sourceStoreId=$SOURCE_STORE_ID&targetStoreId=$TARGET_STORE_ID" \
    -H "Content-Type: application/json")

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo
echo "======================================"
echo "Done!"
echo "======================================"
