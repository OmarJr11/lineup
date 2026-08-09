# Debian slim: Puppeteer's bundled Chrome targets glibc; Alpine (musl) often yields ENOENT or a broken binary.
FROM node:24.14.0-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    chromium \
    ca-certificates \
    fonts-liberation \
  && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY package.json pnpm-lock.yaml* ./
RUN corepack enable \
  && corepack prepare pnpm@10.15.0 --activate \
  && pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the NestJS app
RUN pnpm run build:prod:admin
RUN pnpm run build:prod:users
RUN pnpm run build:prod:businesses
RUN pnpm run build:prod:background-processes

# Expose the ports for both apps
EXPOSE 3000 3001 3002 3003

# Default process; docker-compose overrides per service with node directly.
CMD ["node", "dist/users/apps/users/src/main.js"]

