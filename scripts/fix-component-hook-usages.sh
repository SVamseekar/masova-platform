#!/bin/bash

# Script to update component hook usages after API migration to header-based filtering
# This script removes storeId parameters from hook calls that no longer need them

set -e

echo "Fixing component hook usages..."

# Find all TypeScript/TSX files
find frontend/src -type f \( -name "*.ts" -o -name "*.tsx" \) ! -path "*/node_modules/*" | while read -r file; do
    # Create backup
    cp "$file" "$file.bak"

    # Apply replacements
    sed -i '' \
        -e 's/useGetKitchenQueueQuery(\([^)]*storeId[^)]*\))/useGetKitchenQueueQuery()/g' \
        -e 's/useGetStoreOrdersQuery(\([^)]*storeId[^)]*\))/useGetStoreOrdersQuery()/g' \
        -e 's/useGetOrdersWithFailedQualityChecksQuery(\([^)]*storeId[^)]*\))/useGetOrdersWithFailedQualityChecksQuery()/g' \
        -e 's/useGetTransactionsByStoreIdQuery(\([^)]*storeId[^)]*\))/useGetTransactionsByStoreIdQuery()/g' \
        -e 's/useGetTodaySalesMetricsQuery(\([^)]*storeId[^)]*\))/useGetTodaySalesMetricsQuery()/g' \
        -e 's/useGetAverageOrderValueQuery(\([^)]*storeId[^)]*\))/useGetAverageOrderValueQuery()/g' \
        -e 's/useGetDriverStatusQuery(\([^)]*storeId[^)]*\))/useGetDriverStatusQuery()/g' \
        -e 's/useGetOrderTypeBreakdownQuery(\([^)]*storeId[^)]*\))/useGetOrderTypeBreakdownQuery()/g' \
        -e 's/useGetPeakHoursQuery(\([^)]*storeId[^)]*\))/useGetPeakHoursQuery()/g' \
        -e 's/useGetStoreEmployeesQuery(\([^)]*storeId[^)]*\))/useGetStoreEmployeesQuery()/g' \
        -e 's/useGetActiveStoreSessionsQuery(\([^)]*storeId[^)]*\))/useGetActiveStoreSessionsQuery()/g' \
        -e 's/useGetOperationalStatusQuery(\([^)]*storeId[^)]*\))/useGetOperationalStatusQuery()/g' \
        -e 's/useGetStoreMetricsQuery(\([^)]*storeId[^)]*\))/useGetStoreMetricsQuery()/g' \
        -e 's/useGetEquipmentByStoreQuery(\([^)]*storeId[^)]*\))/useGetEquipmentByStoreQuery()/g' \
        -e 's/useGetEquipmentNeedingMaintenanceQuery(\([^)]*storeId[^)]*\))/useGetEquipmentNeedingMaintenanceQuery()/g' \
        "$file"

    # Check if file changed
    if ! diff -q "$file" "$file.bak" > /dev/null 2>&1; then
        echo "Updated: $file"
    fi

    # Remove backup
    rm "$file.bak"
done

echo "Component hook usages fixed!"
echo ""
echo "Note: Some hooks may need manual fixes for:"
echo "  - useGetSalesTrendsQuery({ storeId, period }) -> useGetSalesTrendsQuery({ period })"
echo "  - useGetStaffLeaderboardQuery({ storeId, period }) -> useGetStaffLeaderboardQuery({ period })"
echo "  - useGetTopProductsQuery({ storeId, ... }) -> useGetTopProductsQuery({ ... })"
echo "  - useGetEquipmentByStatusQuery({ storeId, status }) -> useGetEquipmentByStatusQuery({ status })"
echo "  - useGetReconciliationReportQuery({ storeId, date }) -> useGetReconciliationReportQuery({ date })"
echo "  - useGetStoreSessions({ storeId, date }) -> useGetStoreSessions({ date })"
echo "  - useGetAveragePreparationTimeQuery({ storeId, date }) -> useGetAveragePreparationTimeQuery({ date })"
echo "  - useGetOrdersByMakeTableStationQuery({ storeId, station }) -> useGetOrdersByMakeTableStationQuery({ station })"
echo ""
echo "Running manual fixes for object parameters..."

# Fix object parameters that include storeId
find frontend/src -type f \( -name "*.ts" -o -name "*.tsx" \) ! -path "*/node_modules/*" | while read -r file; do
    # Fix getSalesTrends
    perl -i -pe 's/useGetSalesTrendsQuery\(\{\s*storeId[^,]*,\s*period:\s*([^}]+)\s*\}\)/useGetSalesTrendsQuery({ period: $1 })/g' "$file"

    # Fix getStaffLeaderboard
    perl -i -pe 's/useGetStaffLeaderboardQuery\(\{\s*storeId[^,]*,\s*period:\s*([^}]+)\s*\}\)/useGetStaffLeaderboardQuery({ period: $1 })/g' "$file"

    # Fix getTopProducts - more complex, keep period and sortBy
    perl -i -pe 's/useGetTopProductsQuery\(\{\s*storeId[^,]*,\s*(period:[^,]+,\s*sortBy:[^}]+)\s*\}\)/useGetTopProductsQuery({ $1 })/g' "$file"

    # Fix getReconciliationReport
    perl -i -pe 's/useGetReconciliationReportQuery\(\{\s*storeId[^,]*,\s*date:\s*([^}]+)\s*\}\)/useGetReconciliationReportQuery({ date: $1 })/g' "$file"

    # Fix getStoreSessions
    perl -i -pe 's/useGetStoreSessionsQuery\(\{\s*storeId[^,]*,\s*date:\s*([^}]+)\s*\}\)/useGetStoreSessionsQuery({ date: $1 })/g' "$file"
    perl -i -pe 's/useGetStoreSessionsQuery\(\{\s*storeId[^,]*\s*\}\)/useGetStoreSessionsQuery({})/g' "$file"

    # Fix getAveragePreparationTime
    perl -i -pe 's/useGetAveragePreparationTimeQuery\(\{\s*storeId[^,]*,\s*date:\s*([^}]+)\s*\}\)/useGetAveragePreparationTimeQuery({ date: $1 })/g' "$file"

    # Fix getOrdersByMakeTableStation
    perl -i -pe 's/useGetOrdersByMakeTableStationQuery\(\{\s*storeId[^,]*,\s*station:\s*([^}]+)\s*\}\)/useGetOrdersByMakeTableStationQuery({ station: $1 })/g' "$file"

    # Fix getEquipmentByStatus
    perl -i -pe 's/useGetEquipmentByStatusQuery\(\{\s*storeId[^,]*,\s*status:\s*([^}]+)\s*\}\)/useGetEquipmentByStatusQuery({ status: $1 })/g' "$file"

    # Fix getAveragePreparationTimeByItem
    perl -i -pe 's/useGetAveragePreparationTimeByItemQuery\(\{\s*storeId[^,]*,\s*date:\s*([^}]+)\s*\}\)/useGetAveragePreparationTimeByItemQuery({ date: $1 })/g' "$file"

    # Fix getPreparationTimeDistribution
    perl -i -pe 's/useGetPreparationTimeDistributionQuery\(\{\s*storeId[^,]*,\s*date:\s*([^}]+)\s*\}\)/useGetPreparationTimeDistributionQuery({ date: $1 })/g' "$file"
done

echo "Manual fixes applied!"
echo "Done! Please review changes and test the application."
