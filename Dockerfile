# Deterministic build path for Railway when Railpack's build-driver download is unavailable.
# Production data remains in the attached Postgres service, never in this image.
FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run audit:colors && npm run typecheck && node scripts/check-auto-posters.mjs && node scripts/check-admin-upload.mjs && npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app /app
RUN chown -R node:node /app
COPY scripts/start-streetstar.sh /app/scripts/start-streetstar.sh
EXPOSE 3000
CMD ["sh", "scripts/start-streetstar.sh"]
