#!/usr/bin/env bash
# Test the agent from the terminal with curl (not Convex dashboard).
# Requires: CONVEX_SITE_URL or VITE_CONVEX_SITE_URL set, or pass BASE_URL.
#
# Usage:
#   ./scripts/curl-agent.sh "Hello, find apartments in Riyadh"
#   CONVEX_SITE_URL=https://xxx.convex.site ./scripts/curl-agent.sh "Hello"
#   BASE_URL=https://xxx.convex.site ./scripts/curl-agent.sh "Hi"

set -e
BASE_URL="${BASE_URL:-${CONVEX_SITE_URL:-$VITE_CONVEX_SITE_URL}}"
if [ -z "$BASE_URL" ]; then
  echo "Set CONVEX_SITE_URL or VITE_CONVEX_SITE_URL (or BASE_URL), e.g.:"
  echo "  export CONVEX_SITE_URL=https://YOUR-DEPLOYMENT.convex.site"
  echo "  ./scripts/curl-agent.sh \"Your message\""
  exit 1
fi
BASE_URL="${BASE_URL%/}"
MSG="${1:-Hello, can you help me find apartments in Riyadh?}"
# Escape message for JSON (minimal: backslash and double-quote)
MSG_ESC=$(echo "$MSG" | sed 's/\\/\\\\/g; s/"/\\"/g')
BODY="{\"message\": \"${MSG_ESC}\", \"userId\": \"curl-test\"}"
OUT=$(curl -s -X POST "${BASE_URL}/api/test/agent-reply" \
  -H "Content-Type: application/json" \
  -d "$BODY")
if command -v jq >/dev/null 2>&1; then
  echo "$OUT" | jq .
else
  echo "$OUT"
fi
