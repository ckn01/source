# Build stage
FROM node:23-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build arguments for environment variables
ARG NEXT_PUBLIC_BACKEND_API_URL
ARG NEXT_PUBLIC_DEFAULT_TENANT_CODE
ARG NEXT_PUBLIC_DEFAULT_PRODUCT_CODE
ARG NEXT_PUBLIC_DEFAULT_OBJECT_CODE
ARG NEXT_PUBLIC_DEFAULT_VIEW_CONTENT_CODE
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID

# Set environment variables
ENV NEXT_PUBLIC_BACKEND_API_URL=$NEXT_PUBLIC_BACKEND_API_URL
ENV NEXT_PUBLIC_DEFAULT_TENANT_CODE=$NEXT_PUBLIC_DEFAULT_TENANT_CODE
ENV NEXT_PUBLIC_DEFAULT_PRODUCT_CODE=$NEXT_PUBLIC_DEFAULT_PRODUCT_CODE
ENV NEXT_PUBLIC_DEFAULT_OBJECT_CODE=$NEXT_PUBLIC_DEFAULT_OBJECT_CODE
ENV NEXT_PUBLIC_DEFAULT_VIEW_CONTENT_CODE=$NEXT_PUBLIC_DEFAULT_VIEW_CONTENT_CODE
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID

# Build the application
RUN npm run build

# Production stage
FROM node:23-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Start the application
CMD ["node", "server.js"]