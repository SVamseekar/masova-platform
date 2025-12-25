#!/bin/bash

################################################################################
# MaSoVa - Rollback Script
#
# Purpose: Rolls back MaSoVa installation to a previous version
#          in case of update failures or issues
#
# Usage: ./rollback-masova.sh [VERSION|BACKUP_ID]
#
# Examples:
#   ./rollback-masova.sh 1.0.1           # Rollback to version 1.0.1
#   ./rollback-masova.sh 20251225_143022 # Rollback to specific backup
#   ./rollback-masova.sh                 # Interactive selection
#
################################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INSTALL_DIR="$HOME/MaSoVa"
BACKUP_DIR="$INSTALL_DIR/backups"
TARGET_VERSION="$1"

# Function to print section headers
print_header() {
    echo ""
    echo -e "${BLUE}================================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}================================================================${NC}"
    echo ""
}

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to confirm action
confirm() {
    read -p "$1 (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return 1
    fi
    return 0
}

# Start rollback
print_header "MaSoVa Rollback Utility"
echo "Rollback started at: $(date)"
echo ""

# Check if MaSoVa is installed
if [ ! -d "$INSTALL_DIR" ]; then
    print_error "MaSoVa not found at $INSTALL_DIR"
    exit 1
fi

cd "$INSTALL_DIR"

# Check if backups directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    print_error "No backups found at $BACKUP_DIR"
    echo "Cannot rollback without backups"
    exit 1
fi

# Determine if using Docker
USING_DOCKER=false
if [ -f "docker-compose.yml" ]; then
    USING_DOCKER=true
fi

# Get current version
print_header "Current State"

if [ "$USING_DOCKER" = true ]; then
    CURRENT_VERSION=$(docker exec masova-backend cat /app/version.properties 2>/dev/null | grep "version=" | cut -d'=' -f2 || echo "unknown")
    print_success "Using Docker installation"
else
    CURRENT_VERSION=$(grep "version=" version.properties 2>/dev/null | cut -d'=' -f2 || echo "unknown")
    print_success "Using standalone installation"
fi

echo "Current version: $CURRENT_VERSION"

# If no target specified, show available versions
if [ -z "$TARGET_VERSION" ]; then
    print_header "Available Rollback Points"

    echo "Available backups:"
    echo ""

    # List backups
    BACKUP_COUNT=0
    for backup in $(ls -t "$BACKUP_DIR"); do
        if [ -f "$BACKUP_DIR/$backup/version.txt" ]; then
            BACKUP_VERSION=$(grep "version=" "$BACKUP_DIR/$backup/version.txt" | cut -d'=' -f2)
            BACKUP_DATE=$(grep "backupDate=" "$BACKUP_DIR/$backup/version.txt" | cut -d'=' -f2)
            BACKUP_COUNT=$((BACKUP_COUNT + 1))
            echo "  $BACKUP_COUNT) Version $BACKUP_VERSION"
            echo "     Backup ID: $backup"
            echo "     Date: $BACKUP_DATE"
            echo ""
        fi
    done

    if [ $BACKUP_COUNT -eq 0 ]; then
        print_error "No valid backups found"
        exit 1
    fi

    # Get user selection
    echo ""
    read -p "Select backup number (1-$BACKUP_COUNT) or enter version/backup ID: " selection

    # Parse selection
    if [[ "$selection" =~ ^[0-9]+$ ]] && [ "$selection" -ge 1 ] && [ "$selection" -le "$BACKUP_COUNT" ]; then
        # User selected by number
        SELECTED_BACKUP=$(ls -t "$BACKUP_DIR" | sed -n "${selection}p")
        TARGET_VERSION=$(grep "version=" "$BACKUP_DIR/$SELECTED_BACKUP/version.txt" | cut -d'=' -f2)
    else
        # User entered version or backup ID
        TARGET_VERSION="$selection"
    fi
fi

# Find the backup to use
print_header "Preparing Rollback"

BACKUP_TO_USE=""
ROLLBACK_VERSION=""

# Check if target is a backup ID (timestamp format)
if [ -d "$BACKUP_DIR/$TARGET_VERSION" ]; then
    BACKUP_TO_USE="$BACKUP_DIR/$TARGET_VERSION"
    ROLLBACK_VERSION=$(grep "version=" "$BACKUP_TO_USE/version.txt" | cut -d'=' -f2)
    print_success "Found backup: $TARGET_VERSION"
else
    # Search for backup with matching version
    for backup in $(ls -t "$BACKUP_DIR"); do
        if [ -f "$BACKUP_DIR/$backup/version.txt" ]; then
            BACKUP_VERSION=$(grep "version=" "$BACKUP_DIR/$backup/version.txt" | cut -d'=' -f2)
            if [ "$BACKUP_VERSION" = "$TARGET_VERSION" ]; then
                BACKUP_TO_USE="$BACKUP_DIR/$backup"
                ROLLBACK_VERSION="$TARGET_VERSION"
                print_success "Found backup for version $TARGET_VERSION"
                break
            fi
        fi
    done
fi

if [ -z "$BACKUP_TO_USE" ]; then
    print_error "No backup found for version $TARGET_VERSION"
    echo ""
    echo "Available versions:"
    for backup in $(ls -t "$BACKUP_DIR"); do
        if [ -f "$BACKUP_DIR/$backup/version.txt" ]; then
            BACKUP_VERSION=$(grep "version=" "$BACKUP_DIR/$backup/version.txt" | cut -d'=' -f2)
            echo "  - $BACKUP_VERSION (Backup: $backup)"
        fi
    done
    exit 1
fi

# Confirm rollback
echo ""
echo "Rollback details:"
echo "  From: $CURRENT_VERSION"
echo "  To:   $ROLLBACK_VERSION"
echo "  Backup: $(basename $BACKUP_TO_USE)"
echo ""

if ! confirm "⚠️  Are you sure you want to rollback?"; then
    echo "Rollback cancelled"
    exit 0
fi

# Perform rollback
print_header "Performing Rollback"

# Create a backup of current state (before rollback)
ROLLBACK_BACKUP_DIR="$BACKUP_DIR/before_rollback_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$ROLLBACK_BACKUP_DIR"
if [ -f ".env" ]; then
    cp .env "$ROLLBACK_BACKUP_DIR/.env.backup"
fi
echo "version=$CURRENT_VERSION" > "$ROLLBACK_BACKUP_DIR/version.txt"
echo "backupDate=$(date)" >> "$ROLLBACK_BACKUP_DIR/version.txt"
print_success "Current state backed up to: $ROLLBACK_BACKUP_DIR"

if [ "$USING_DOCKER" = true ]; then
    # Docker rollback
    echo "Stopping current services..."
    docker-compose down

    # Update docker-compose.yml to use rollback version
    if [ -f "docker-compose.yml" ]; then
        sed -i.bak "s|image: masova/backend:.*|image: masova/backend:$ROLLBACK_VERSION|g" docker-compose.yml
        sed -i.bak "s|image: masova/frontend:.*|image: masova/frontend:$ROLLBACK_VERSION|g" docker-compose.yml
        rm docker-compose.yml.bak
        print_success "Updated docker-compose.yml"
    fi

    # Pull the old version (if needed)
    echo "Pulling version $ROLLBACK_VERSION..."
    if ! docker pull masova/backend:$ROLLBACK_VERSION 2>/dev/null; then
        print_warning "Could not pull version $ROLLBACK_VERSION from registry"
        echo "Using local image if available..."
    fi

    # Restore .env if backed up
    if [ -f "$BACKUP_TO_USE/.env.backup" ]; then
        if confirm "Restore .env file from backup?"; then
            cp "$BACKUP_TO_USE/.env.backup" .env
            print_success ".env restored from backup"
        fi
    fi

    # Start with rollback version
    echo "Starting services with version $ROLLBACK_VERSION..."
    docker-compose up -d

else
    # Standalone JAR rollback
    echo "Stopping current services..."
    ./stop-masova.sh 2>/dev/null || true

    # Restore JARs from backup
    if [ -d "$BACKUP_TO_USE/jars" ]; then
        echo "Restoring JARs from backup..."
        rm -f *.jar
        cp "$BACKUP_TO_USE/jars"/*.jar .
        print_success "JARs restored from backup"
    else
        # Download specific version
        echo "Downloading version $ROLLBACK_VERSION..."
        TEMP_DIR=$(mktemp -d)
        cd "$TEMP_DIR"

        if curl -L -o masova-$ROLLBACK_VERSION.tar.gz "https://releases.masova.com/v$ROLLBACK_VERSION/masova-$ROLLBACK_VERSION.tar.gz"; then
            tar -xzf masova-$ROLLBACK_VERSION.tar.gz
            cd "$INSTALL_DIR"
            rm -f *.jar
            cp "$TEMP_DIR"/*.jar .
            cp "$TEMP_DIR"/start-masova.sh .
            chmod +x start-masova.sh
            print_success "Version $ROLLBACK_VERSION downloaded and installed"
        else
            print_error "Could not download version $ROLLBACK_VERSION"
            cd "$INSTALL_DIR"
            rm -rf "$TEMP_DIR"
            exit 1
        fi

        rm -rf "$TEMP_DIR"
    fi

    # Restore .env if backed up
    if [ -f "$BACKUP_TO_USE/.env.backup" ]; then
        if confirm "Restore .env file from backup?"; then
            cp "$BACKUP_TO_USE/.env.backup" .env
            print_success ".env restored from backup"
        fi
    fi

    # Start services
    echo "Starting services..."
    ./start-masova.sh &
fi

# Verify rollback
print_header "Verifying Rollback"

echo "Waiting for services to start..."
sleep 15

# Health check
HEALTH_CHECK_URL="http://localhost:8080/actuator/health"
MAX_RETRIES=12
RETRY_COUNT=0
ROLLBACK_SUCCESS=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s "$HEALTH_CHECK_URL" | grep -q "UP"; then
        print_success "Health check passed"
        ROLLBACK_SUCCESS=true
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo "Waiting for services... ($RETRY_COUNT/$MAX_RETRIES)"
        sleep 5
    fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    print_error "Services failed to start"
    ROLLBACK_SUCCESS=false
fi

# Verify version
if [ "$USING_DOCKER" = true ]; then
    NEW_VERSION=$(docker exec masova-backend cat /app/version.properties 2>/dev/null | grep "version=" | cut -d'=' -f2 || echo "unknown")
else
    NEW_VERSION=$(grep "version=" version.properties 2>/dev/null | cut -d'=' -f2 || echo "unknown")
fi

echo "Current version: $NEW_VERSION"

if [ "$NEW_VERSION" = "$ROLLBACK_VERSION" ]; then
    print_success "Version verified: $NEW_VERSION"
else
    print_warning "Version mismatch: expected $ROLLBACK_VERSION, got $NEW_VERSION"
fi

# Restore database (if needed)
if [ "$USING_DOCKER" = true ] && [ -d "/data/backup/$(basename $BACKUP_TO_USE)" ]; then
    echo ""
    if confirm "Do you want to restore the database from this backup?"; then
        echo "Restoring database..."
        docker-compose exec -T mongodb mongorestore /data/backup/$(basename $BACKUP_TO_USE) --drop
        print_success "Database restored"
    fi
fi

# Final result
print_header "Rollback Summary"

if [ "$ROLLBACK_SUCCESS" = true ]; then
    print_success "Rollback completed successfully!"
    echo ""
    echo "Rolled back from: $CURRENT_VERSION → $ROLLBACK_VERSION"
    echo "Rollback time: $(date)"
    echo ""
    echo "Access MaSoVa at:"
    echo "  🌐 http://localhost:3000"
    echo "  📊 Health: http://localhost:8080/actuator/health"
    echo ""
    echo "Your previous state was backed up to:"
    echo "  $ROLLBACK_BACKUP_DIR"
    echo ""
    print_success "MaSoVa is ready to use! 🚀"
else
    print_error "Rollback failed!"
    echo ""
    echo "The system may not be working correctly."
    echo ""
    echo "Troubleshooting steps:"
    echo "  1. Check logs:"
    if [ "$USING_DOCKER" = true ]; then
        echo "     docker-compose logs -f"
    else
        echo "     Check service logs in logs/ directory"
    fi
    echo "  2. Manual restart:"
    if [ "$USING_DOCKER" = true ]; then
        echo "     docker-compose restart"
    else
        echo "     ./stop-masova.sh && ./start-masova.sh"
    fi
    echo "  3. Contact support: support@masova.com"
    echo ""
    exit 1
fi

echo ""
print_success "Rollback complete! 🎉"
