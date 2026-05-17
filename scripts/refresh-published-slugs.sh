#!/usr/bin/env bash
# Haalt alle gepubliceerde page-slugs op via WP-CLI en schrijft naar app/lib/published-slugs.ts
set -e

VS_TMP=$(mktemp)
OBL_TMP=$(mktemp)

ssh julian@web10.construkt.io "sudo -u verhaa /usr/local/bin/wp post list --post_type=page --post_status=publish --fields=post_name --format=csv --path=/home/verhaa/domains/verhaalsommen.nl/public_html" | tail -n +2 > "$VS_TMP"
ssh julian@web10.construkt.io "sudo -u oefenbe /usr/local/bin/wp post list --post_type=page --post_status=publish --fields=post_name --format=csv --path=/home/oefenbe/domains/oefenbegrijpendlezen.nl/public_html" | tail -n +2 > "$OBL_TMP"

DATE=$(date +%Y-%m-%d)
OUT="$(dirname "$0")/../app/lib/published-slugs.ts"

{
  echo "// Auto-gegenereerd op $DATE vanuit WP-CLI. Update via scripts/refresh-published-slugs.sh."
  echo ""
  echo "export const VERHAALSOMMEN_PUBLISHED_SLUGS = new Set<string>(["
  awk '{printf "  \"%s\",\n", $0}' "$VS_TMP"
  echo "]);"
  echo ""
  echo "export const OBL_PUBLISHED_SLUGS = new Set<string>(["
  awk '{printf "  \"%s\",\n", $0}' "$OBL_TMP"
  echo "]);"
} > "$OUT"

rm "$VS_TMP" "$OBL_TMP"
echo "Updated $OUT"
