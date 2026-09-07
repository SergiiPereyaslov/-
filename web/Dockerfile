# syntax=docker/dockerfile:1

# ── Залежності ───────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
# Prisma на Alpine потребує openssl для генерації клієнта
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
# postinstall викликає prisma generate, тому схема має бути скопійована раніше
RUN npm ci

# ── Збірка ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Адреса сайту потрапляє в canonical, hreflang і sitemap ще на збірці,
# тому передається аргументом, а не лише змінною середовища на старті.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_GA_ID
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Запуск ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# standalone тягне лише потрібні модулі; public і static копіюємо окремо
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/robots.txt').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]

# ── Міграції та обслуговування ───────────────────────────────────────────
# Окремий образ із повним node_modules: CLI Prisma тягне багато залежностей,
# і копіювати їх частинами в runner — джерело важковловимих поломок.
# Запуск:  docker compose run --rm migrate
FROM builder AS migrate
WORKDIR /app
ENV NODE_ENV=production
CMD ["npx", "prisma", "migrate", "deploy"]
