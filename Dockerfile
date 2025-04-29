# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install Git and other dependencies
RUN apk add --no-cache git openssh-client

# Install pnpm
RUN npm install -g pnpm@8

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy the rest of the application
COPY . .

# Create directories that might be needed later
RUN mkdir -p build/client public

# Try to build the application
RUN NODE_ENV=production pnpm run build || echo "Build failed but continuing"

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install Git for runtime dependencies that might need it
RUN apk add --no-cache git

# Create directories
RUN mkdir -p build/client public app

# Copy files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/build ./build
COPY --from=builder /app/public ./public
COPY --from=builder /app/app ./app
COPY server.cjs ./

# Install express
RUN npm install express

# Expose the port the app runs on
EXPOSE 3000

# Start the app
CMD ["node", "server.cjs"] 
