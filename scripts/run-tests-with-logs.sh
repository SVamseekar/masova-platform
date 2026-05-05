#!/usr/bin/env bash
# MaSoVa — Run API test suite and fetch Dell service logs for the test window
#
# Usage:
#   ./scripts/run-tests-with-logs.sh
#   ./scripts/run-tests-with-logs.sh --ssh          # also fetch Dell combined log via SSH
#   ./scripts/run-tests-with-logs.sh --errors-only  # show only ERROR/WARN from Dell log
#
# Prerequisites for --ssh:
#   ssh-copy-id user@192.168.50.88   (passwordless SSH set up once)

DELL_IP="192.168.50.88"
DELL_USER="${DELL_SSH_USER:-$USER}"          # override with: DELL_SSH_USER=sourav ./run-tests-with-logs.sh
DELL_LOG="C:/masova-logs/combined.log"
REPORT_DIR="$(dirname "$0")/../testing/reports"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
REPORT="$REPORT_DIR/test-run-$TIMESTAMP.txt"

mkdir -p "$REPORT_DIR"

FETCH_SSH=false
ERRORS_ONLY=false
for arg in "$@"; do
    case $arg in
        --ssh)          FETCH_SSH=true ;;
        --errors-only)  ERRORS_ONLY=true ;;
    esac
done

echo ""
echo "============================================"
echo "  MaSoVa API Test Suite"
echo "  $(date)"
echo "============================================"
echo ""

# ── Record start time for log window ──────────────────────────────────────
START_TIME=$(date +%H:%M:%S)

# ── Run test suite ─────────────────────────────────────────────────────────
TEST_OUTPUT=$(node "$(dirname "$0")/test-api-full.js" 2>&1)
EXIT_CODE=$?

END_TIME=$(date +%H:%M:%S)

# ── Print and save test results ───────────────────────────────────────────
echo "$TEST_OUTPUT"
echo "$TEST_OUTPUT" > "$REPORT"

echo ""
echo "--------------------------------------------"
echo "  Test run: $START_TIME → $END_TIME"
echo "  Report saved: $REPORT"
echo "--------------------------------------------"

# ── Extract summary line ──────────────────────────────────────────────────
SUMMARY=$(echo "$TEST_OUTPUT" | grep -E "Results:")
echo "  $SUMMARY"
echo ""

# ── Fetch Dell logs via SSH ───────────────────────────────────────────────
if $FETCH_SSH; then
    echo "Fetching service logs from Dell ($DELL_IP)..."
    DELL_LOG_LOCAL="$REPORT_DIR/dell-logs-$TIMESTAMP.txt"

    # Pull lines from combined.log that fall between START_TIME and END_TIME
    # (lines are prefixed [HH:MM:SS] by watch-logs.ps1 / start-services.ps1)
    ssh "$DELL_USER@$DELL_IP" \
        "powershell -Command \"Get-Content '$DELL_LOG'\"" \
        > "$DELL_LOG_LOCAL" 2>/dev/null

    if [ $? -eq 0 ]; then
        echo "  Dell log saved: $DELL_LOG_LOCAL"

        if $ERRORS_ONLY; then
            echo ""
            echo "=== ERRORS & WARNINGS from Dell services during test run ==="
            grep -E '\] (ERROR|WARN) ' "$DELL_LOG_LOCAL" | \
                grep -E "\[$START_TIME\]|\[$END_TIME\]" || \
                grep -E '\] (ERROR|WARN) ' "$DELL_LOG_LOCAL" | tail -100
        else
            echo "  To view: cat $DELL_LOG_LOCAL"
            echo "  Errors only: grep -E 'ERROR|WARN' $DELL_LOG_LOCAL"
        fi
    else
        echo "  [WARN] SSH to Dell failed — set up passwordless SSH:"
        echo "         ssh-copy-id $DELL_USER@$DELL_IP"
    fi
fi

echo ""
exit $EXIT_CODE
