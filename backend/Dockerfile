# syntax=docker/dockerfile:1

FROM denoland/deno:2.1.4

WORKDIR /app

# psql for Railway preDeploy migrations
USER root
RUN apt-get update && apt-get install -y --no-install-recommends postgresql-client \
  && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --uid 10001 appuser

COPY --chown=appuser:appuser . .

USER appuser

ENV DENO_DIR=/tmp/deno_dir
ENV PORT=8080

RUN deno cache --config supabase/functions/deno.json --allow-env --allow-net --allow-read src/main.ts

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD deno eval "const p=Deno.env.get('PORT')??'8080'; const r=await fetch('http://127.0.0.1:'+p+'/v1/health'); Deno.exit(r.ok?0:1)"

CMD ["deno", "run", "--config", "supabase/functions/deno.json", "--allow-env", "--allow-net", "--allow-read", "src/main.ts"]
