FROM denoland/deno:alpine-2.0.2

WORKDIR /app

# Cache dependencies first
COPY deno.json deno.lock mod.ts ./
COPY src ./src
COPY openapi.json ./openapi.json

RUN deno cache mod.ts

# Copy rest (docs, clients, etc.)
COPY . .

ENV PORT=8000
ENV DB_PATH=/tmp/schemas.db
ENV DENO_ENV=production
ENV SEED_SAMPLES=1

EXPOSE 8000

CMD ["run", "--allow-net", "--allow-read", "--allow-write", "--allow-env", "mod.ts"]