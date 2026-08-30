DENO_TEST=deno test --config supabase/functions/deno.json --allow-env --allow-read --allow-net --no-check
PORT?=8080

.PHONY: serve test migrate smoke docker-build preflight

serve:
	deno run --config supabase/functions/deno.json --allow-env --allow-net --allow-read --watch src/main.ts

test:
	$(DENO_TEST) supabase/tests/unit_foundation_test.ts \
		supabase/tests/unit_business_onboarding_test.ts \
		supabase/tests/unit_business_management_test.ts \
		supabase/tests/unit_catalog_vehicles_test.ts \
		supabase/tests/unit_appointments_test.ts \
		supabase/tests/unit_quotations_test.ts \
		supabase/tests/unit_invoices_test.ts \
		supabase/tests/unit_reviews_test.ts \
		supabase/tests/unit_disputes_test.ts \
		supabase/tests/contract/

migrate:
	bash scripts/migrate.sh

smoke:
	bash scripts/smoke.sh

docker-build:
	docker build -t garagefinder-api .

preflight:
	@test -d supabase/migrations || (echo "FAIL: migrations missing" && exit 1)
	@ls supabase/migrations/*.sql >/dev/null 2>&1 || (echo "FAIL: no migrations" && exit 1)
	@echo "migrations: $$(ls supabase/migrations/*.sql | wc -l | tr -d ' ') files"
	@command -v deno >/dev/null || (echo "WARN: deno not on PATH" && true)
	@echo "preflight OK"
