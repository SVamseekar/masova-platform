#!/bin/bash

# Script to clean up duplicate active working sessions in MongoDB

echo "========================================="
echo "Duplicate Session Cleanup Script"
echo "========================================="
echo ""

# Check if mongosh is installed
if ! command -v mongosh &> /dev/null; then
    echo "Error: mongosh is not installed or not in PATH"
    echo "Please install MongoDB Shell (mongosh) first"
    exit 1
fi

# MongoDB connection details (modify if needed)
MONGO_HOST="${MONGO_HOST:-localhost}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_DB="masova_users"

echo "Connecting to MongoDB at $MONGO_HOST:$MONGO_PORT"
echo "Database: $MONGO_DB"
echo ""

# Ask for confirmation
read -p "This will close duplicate active sessions. Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

# Run the cleanup script
echo "Running cleanup script..."
echo ""

mongosh "mongodb://$MONGO_HOST:$MONGO_PORT/$MONGO_DB" < cleanup-duplicate-sessions.js

echo ""
echo "========================================="
echo "Cleanup complete!"
echo "========================================="
