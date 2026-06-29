#!/usr/bin/env bash
# Install tracked git hooks for this clone (Mac Git Bash or Dell Git for Windows).
# Usage: ./scripts/install-git-hooks.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

chmod +x scripts/git-hooks/pre-commit
git config core.hooksPath scripts/git-hooks

echo "Installed pre-commit hook from scripts/git-hooks/pre-commit"
echo "core.hooksPath=$(git config core.hooksPath)"