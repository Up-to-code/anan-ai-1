#!/bin/bash
# Fix mobile submodule and prepare for push
set -e
cd "$(dirname "$0")"

echo "=== Fixing mobile submodule ==="
git rm --cached mobile 2>/dev/null || true
rm -rf .git/modules/mobile 2>/dev/null || true
rm -rf mobile/.git 2>/dev/null || true

echo "=== Adding all files ==="
git add -A

echo "=== Status ==="
git status

echo ""
echo "=== Run these next ==="
echo "  git commit -m 'Initial commit: anan-ai'"
echo "  git push -u origin main"
echo ""
echo "403 error? 1) Create anan-ai at https://github.com/new  2) Or use token in URL"
