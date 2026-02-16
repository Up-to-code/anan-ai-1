#!/usr/bin/env bash
# Minimal curl-based agent chat loop. No Bun/Node required - uses curl (and jq if available).
#
# Usage:
#   ./scripts/curl-agent-loop.sh
#   USER_ID=my-user ./scripts/curl-agent-loop.sh
#   CONVEX_SITE_URL=https://... ./scripts/curl-agent-loop.sh
#
# Press Enter with empty input to exit.

BASE_URL="${CONVEX_SITE_URL:-${VITE_CONVEX_SITE_URL:-https://outstanding-mastiff-930.convex.site}}"
BASE_URL="${BASE_URL%/}"
USER_ID="${USER_ID:-curl-agent-loop}"

echo "Agent chat (userId: $USER_ID)"
echo "Empty input to exit."
echo ""

while true; do
  read -r -p "> " msg
  if [ -z "$msg" ]; then
    echo "Bye."
    exit 0
  fi

  RES=$(curl -s -X POST "$BASE_URL/api/test/agent-reply" \
    -H "Content-Type: application/json" \
    -d "{\"message\":$(echo "$msg" | jq -Rs .),\"userId\":\"$USER_ID\",\"channel\":\"app\"}")

  if command -v jq >/dev/null 2>&1; then
    echo "$RES" | jq -r '
      if .error then "Error: " + .error
      else
        (if .text then .text + "\n" else "" end) +
        (if .imageUrl then "Image: " + .imageUrl + "\n" else "" end) +
        (if .imageUrls then (.imageUrls | map("Image: " + .) | join("\n")) + "\n" else "" end) +
        (if .offerBlocks then (.offerBlocks | map("- \(.title // "-"): \(.summary // "")" + (if .link then "\n  \(.link)" else "" end)) | join("\n")) + "\n" else "" end) +
        (if .threadId then "[threadId: " + .threadId + "]" else "" end)
      end
    '
  else
    echo "$RES"
  fi
  echo ""
done
