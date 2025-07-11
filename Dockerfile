# Use official Node.js image (latest LTS 22.16.0)
FROM node:22.16.0-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the NestJS app
RUN npm run build

# Expose the ports for both apps
EXPOSE 3000 3001

# Comando por defecto: levantar ambas apps en producción
CMD ["npm", "run", "start:all:dev"]
