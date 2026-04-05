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

COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the NestJS app
RUN npm run build:prod:admin
RUN npm run build:prod:users
RUN npm run build:prod:businesses
RUN npm run build:prod:background-processes

# Expose the ports for both apps
EXPOSE 3000 3001 3002 3003

# Comando por defecto: levantar ambas apps en producción
CMD ["npm", "run", "start:all:prod"]

