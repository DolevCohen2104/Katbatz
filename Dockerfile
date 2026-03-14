# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .

RUN npm run build

# Stage 2: Serve
FROM node:20-alpine

WORKDIR /app

# Install 'serve' to serve static files
RUN npm install -g serve

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Expose port (Cloud Run defaults to 8080)
EXPOSE 8080

# Command to serve the application on port 8080
CMD ["serve", "-s", "dist", "-l", "8080"]
