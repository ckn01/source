# Build stage - Gunakan Go 1.24 untuk AI service
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install git (needed for some Go modules)
RUN apk add --no-cache git

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Final stage
FROM alpine:latest

WORKDIR /app

# Install ca-certificates for HTTPS requests
RUN apk --no-cache add ca-certificates tzdata

# Create docs directory
RUN mkdir -p /app/docs

# Copy the binary from builder stage
COPY --from=builder /app/main .

# Copy docs if they exist
COPY --from=builder /app/docs/ /app/docs/

# Expose port
EXPOSE 8081

# Run the application
CMD ["./main"]