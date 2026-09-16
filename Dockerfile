# syntax=docker/dockerfile:1

###############################################################################
# Well Production Monitoring Dashboard — production image
#
# Multi-stage so the final image carries only what is needed to serve the app:
#   deps    install node_modules from the lockfile (cached independently)
#   builder compile the Next.js app
#   runner  the standalone server bundle, run as a non-root user
#
# `output: 'standalone'` in next.config.mjs emits .next/standalone with a
# minimal server.js plus only the node_modules actually reached at runtime.
###############################################################################

# ---- deps -------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app

# Copy only the manifests first so this layer is reused whenever application
# code changes but dependencies do not.
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder ----------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- runner -----------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as an unprivileged user rather than root.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 --ingroup nodejs nextjs

# Static assets and the standalone server bundle.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# The CSV is read from disk at request time by /api/readings, so it has to be
# in the image — the standalone trace only covers JavaScript.
COPY --from=builder --chown=nextjs:nodejs /app/data ./data

USER nextjs
EXPOSE 3000

# Fails the container health check if the API stops serving the dataset.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/readings').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
