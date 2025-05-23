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

# Expose the port (ajusta si usas otros)
EXPOSE 3000 3001

# Start the app (ajusta si tu entrypoint es otro)
CMD ["npm", "run", "start:prod"]
