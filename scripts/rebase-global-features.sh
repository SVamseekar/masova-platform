#!/usr/bin/env bash
# Rebase Global-2/3/4 feature branches onto current origin/main.
# Run AFTER PR #17 is merged to main.
#
# Usage (Mac or Dell Git Bash):
#   ./scripts/rebase-global-features.sh          # rebase all three
#   ./scripts/rebase-global-features.sh global-2 # one branch only

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BRANCHES=(
  feature/global-2-eu-vat-engine
  feature/global-3-currency-locale-i18n
  feature/global-4-stripe-payments
)

rebase_one() {
  local branch="$1"
  echo "==> Rebase $branch onto origin/main"
  git fetch origin --prune
  if ! git show-ref --verify --quiet "refs/heads/$branch"; then
    git checkout -b "$branch" "origin/$branch"
  else
    git checkout "$branch"
  fi
  git rebase origin/main
  echo "==> Push $branch (force-with-lease)"
  git push --force-with-lease origin "$branch"
  echo "==> Done: $branch"
}

git fetch origin --prune

if [[ "${1:-}" == "global-2" ]]; then
  rebase_one feature/global-2-eu-vat-engine
elif [[ "${1:-}" == "global-3" ]]; then
  rebase_one feature/global-3-currency-locale-i18n
elif [[ "${1:-}" == "global-4" ]]; then
  rebase_one feature/global-4-stripe-payments
else
  for b in "${BRANCHES[@]}"; do
    rebase_one "$b" || {
      echo "FAILED on $b — resolve conflicts, then: git rebase --continue && git push --force-with-lease origin $b"
      exit 1
    }
  done
fi

echo "All requested rebases complete."