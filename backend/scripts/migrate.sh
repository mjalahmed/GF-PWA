#!/usr/bin/env bash
# Apply forward-only SQL migrations to DATABASE_URL (Railway PostgreSQL).
# Safe to re-run: tracks applied files in schema_migrations table.
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" && -z "${POSTGRES_URL:-}" ]]; then
  echo "migrate: DATABASE_URL not set — skipping migrations (configure Railway PostgreSQL plugin)"
  exit 0
fi

DB_URL="${DATABASE_URL:-${POSTGRES_URL}}"

command -v psql >/dev/null || {
  echo "migrate: psql not found — install postgresql-client in build image or run migrations via CI"
  exit 0
}

MIGRATIONS_DIR="${MIGRATIONS_DIR:-supabase/migrations}"

echo "migrate: ensuring schema_migrations table exists"
psql "$DB_URL" -v ON_ERROR_STOP=1 -q <<'SQL'
CREATE TABLE IF NOT EXISTS public.schema_migrations (
  filename text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
SQL

shopt -s nullglob
files=("$MIGRATIONS_DIR"/*.sql)
IFS=$'\n' files=($(sort <<<"${files[*]}"))
unset IFS

if [[ ${#files[@]} -eq 0 ]]; then
  echo "migrate: no migration files in $MIGRATIONS_DIR"
  exit 0
fi

for file in "${files[@]}"; do
  filename=$(basename "$file")
  applied=$(psql "$DB_URL" -tAc "SELECT 1 FROM public.schema_migrations WHERE filename = '$filename' LIMIT 1" || echo "")
  if [[ "$applied" == "1" ]]; then
    echo "migrate: skip $filename (already applied)"
    continue
  fi
  echo "migrate: applying $filename"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$file"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -q -c "INSERT INTO public.schema_migrations (filename) VALUES ('$filename')"
done

echo "migrate: complete (${#files[@]} files checked)"
