#!/usr/bin/env bash
# watch-logs.sh — tail MaSoVa backend logs from Dell over SSH, saved locally
#
# Usage:
#   ./scripts/watch-logs.sh                     # tail all 6 services
#   ./scripts/watch-logs.sh commerce payment     # tail specific services
#
# Logs are saved to: logs/latest/<service>.log (replaced on every run)

DELL_IP="192.168.50.88"
DELL_USER="Vamsee"

# Where services live on Dell
DELL_BASE="C:\\masova-logs"

# Local log directory — cleared and replaced on every run
LOCAL_LOG_DIR="$(cd "$(dirname "$0")/.." && pwd)/logs/latest"
rm -rf "$LOCAL_LOG_DIR"
mkdir -p "$LOCAL_LOG_DIR"

# Service name → directory name on Dell
svc_dir() {
  case "$1" in
    api-gateway) echo "api-gateway" ;;
    core)        echo "core-service" ;;
    commerce)    echo "commerce-service" ;;
    payment)     echo "payment-service" ;;
    logistics)   echo "logistics-service" ;;
    intel)       echo "intelligence-service" ;;
    *)           echo "" ;;
  esac
}

# Colors
svc_color() {
  case "$1" in
    api-gateway) echo "\033[1;36m" ;;  # cyan
    core)        echo "\033[1;32m" ;;  # green
    commerce)    echo "\033[1;33m" ;;  # yellow
    payment)     echo "\033[1;35m" ;;  # magenta
    logistics)   echo "\033[1;34m" ;;  # blue
    intel)       echo "\033[1;31m" ;;  # red
    *)           echo "\033[0m" ;;
  esac
}
RESET="\033[0m"

ALL_SERVICES="api-gateway core commerce payment logistics intel"

if [ $# -gt 0 ]; then
  SELECTED="$*"
else
  SELECTED="$ALL_SERVICES"
fi

# SSH control socket for multiplexing — type password only once
SSH_SOCKET="/tmp/masova-ssh-$$"

echo "Connecting to Dell ($DELL_USER@$DELL_IP)..."
ssh -M -S "$SSH_SOCKET" -o ConnectTimeout=10 -o ControlPersist=yes \
    -f -N "${DELL_USER}@${DELL_IP}"

if [ $? -ne 0 ]; then
  echo "Failed to connect to Dell."
  exit 1
fi

echo "Connected. Tailing logs..."
echo "Press Ctrl+C to stop."
echo ""

PIDS=""

for svc in $SELECTED; do
  dir="$(svc_dir "$svc")"
  color="$(svc_color "$svc")"

  if [ -z "$dir" ]; then
    echo "Unknown service: $svc (valid: $ALL_SERVICES)"
    continue
  fi

  log_path="${DELL_BASE}\\${dir}.log"
  local_log="${LOCAL_LOG_DIR}/${svc}.log"

  ssh -S "$SSH_SOCKET" "${DELL_USER}@${DELL_IP}" \
      "powershell -Command \"Get-Content -Path '${log_path}' -Wait -Tail 20\"" \
    | while IFS= read -r line; do
        printf "${color}[%-11s]${RESET} %s\n" "$svc" "$line"
        echo "$line" >> "$local_log"
      done &

  PIDS="$PIDS $!"
  echo "  Tailing $svc → saving to logs/latest/${svc}.log"
done

echo ""

trap 'echo ""; echo "Stopping..."; kill $PIDS 2>/dev/null; ssh -S "$SSH_SOCKET" -O exit "${DELL_USER}@${DELL_IP}" 2>/dev/null; exit 0' INT TERM


wait
