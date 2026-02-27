#!/bin/bash
# Load environment variables from .env file and export them

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found at $ENV_FILE"
    exit 1
fi

# Export all variables from .env file
set -a
source "$ENV_FILE"
set +a

echo "Environment variables loaded from .env file"
echo "JWT_SECRET is set: ${JWT_SECRET:0:20}..."
