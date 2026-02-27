#!/bin/bash

# Script to add Serializable to all analytics DTOs

DTOs=(
    "SalesForecastResponse"
    "CostAnalysisResponse"
    "OrderTypeBreakdownResponse"
    "CustomerBehaviorResponse"
    "TopProductsResponse"
    "StaffPerformanceResponse"
    "ChurnPredictionResponse"
    "ExecutiveSummaryResponse"
    "BenchmarkingResponse"
    "SalesTrendResponse"
    "DemandForecastResponse"
    "PeakHoursResponse"
    "StaffLeaderboardResponse"
)

BASE_DIR="analytics-service/src/main/java/com/MaSoVa/analytics/dto"

for dto in "${DTOs[@]}"; do
    FILE="$BASE_DIR/${dto}.java"
    if [ -f "$FILE" ]; then
        echo "Processing $FILE..."

        # Check if already has Serializable
        if grep -q "implements Serializable" "$FILE"; then
            echo "  ✓ Already has Serializable"
            continue
        fi

        # Add import if not present
        if ! grep -q "import java.io.Serializable;" "$FILE"; then
            sed -i '' '/^package/a\
\
import java.io.Serializable;
' "$FILE"
        fi

        # Add implements Serializable to class declaration
        sed -i '' "s/public class ${dto} {/public class ${dto} implements Serializable {\n    private static final long serialVersionUID = 1L;/g" "$FILE"

        echo "  ✓ Added Serializable"
    else
        echo "  ✗ File not found: $FILE"
    fi
done

echo ""
echo "✓ All DTOs updated!"
