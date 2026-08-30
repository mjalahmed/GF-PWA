#!/usr/bin/env bash
set -euo pipefail
exec deno run \
  --config supabase/functions/deno.json \
  --allow-env \
  --allow-net \
  --allow-read \
  src/main.ts
