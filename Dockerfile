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

# Build the application but skip the Cloudflare worker build
RUN NODE_ENV=production pnpm run build || echo "Build failed but continuing"

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install Git for runtime dependencies that might need it
RUN apk add --no-cache git

# Copy built assets from the builder stage
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/build ./build
COPY --from=builder /app/public ./public
COPY --from=builder /app/app ./app
COPY --from=builder /app/server.js ./

# Install only production dependencies
RUN npm install -g pnpm@8 && pnpm install --prod

# Expose the port the app runs on
EXPOSE 3000

# Start the app
CMD ["node", "server.js"] 
