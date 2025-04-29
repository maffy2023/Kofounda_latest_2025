FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy application files
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy built files from builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Install production dependencies only
RUN npm install -g pnpm && pnpm install --production

# Expose port
EXPOSE 80
EXPOSE 443

# Start the application
CMD ["pnpm", "start"] 
