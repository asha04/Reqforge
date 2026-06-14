#!/usr/bin/env bash
# Push ReqForge to a fresh GitHub repository.
# Usage:  ./scripts/push-to-github.sh <github-username> <repo-name>
# Example: ./scripts/push-to-github.sh alice reqforge

set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage: $0 <github-username> <repo-name>"
  echo "Example: $0 alice reqforge"
  exit 1
fi

USER="$1"
REPO="$2"
BRANCH="${3:-main}"

# Move to repo root regardless of where this is invoked from
cd "$(dirname "$0")/.."

if [ ! -d .git ]; then
  echo "→ Initializing git repository"
  git init -b "$BRANCH"
fi

echo "→ Staging files"
git add .

if git diff --cached --quiet; then
  echo "  Nothing to commit."
else
  echo "→ Creating commit"
  git commit -m "Initial commit: ReqForge — DNG Requirements Conversion & ReqIF Generator"
fi

# Check whether gh CLI is available to create the remote repo automatically
if command -v gh >/dev/null 2>&1; then
  echo "→ Creating GitHub repo via gh CLI"
  gh repo create "$USER/$REPO" --public --source=. --remote=origin --push || {
    echo "  gh repo create failed. If the repo already exists, falling back to manual push."
    git remote add origin "https://github.com/$USER/$REPO.git" 2>/dev/null || true
    git push -u origin "$BRANCH"
  }
else
  echo "→ gh CLI not found. Setting remote and pushing manually."
  echo "  First create the repo at: https://github.com/new (name: $REPO)"
  echo "  Then press Enter to continue, or Ctrl-C to abort."
  read -r _

  git remote add origin "https://github.com/$USER/$REPO.git" 2>/dev/null || \
    git remote set-url origin "https://github.com/$USER/$REPO.git"
  git push -u origin "$BRANCH"
fi

echo
echo "✓ Done. Your repo: https://github.com/$USER/$REPO"
echo
echo "To enable GitHub Pages (so visitors can use ReqForge in the browser):"
echo "  1. Go to https://github.com/$USER/$REPO/settings/pages"
echo "  2. Set Source = Deploy from a branch, Branch = $BRANCH / (root)"
echo "  3. Save. Your live app: https://$USER.github.io/$REPO/"
