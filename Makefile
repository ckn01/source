.PHONY: build up down logs clean restart

# Build all services
build:
	docker-compose build

# Start all services
up:
	docker-compose up -d

# Stop all services
down:
	docker-compose down

# View logs
logs:
	docker-compose logs -f

# Clean up (remove containers, networks, volumes)
clean:
	docker-compose down -v --remove-orphans
	docker system prune -f

# Restart all services
restart: down up

# Start only backend services
backend:
	docker-compose up -d postgres redis fetchly-backend fetchly-ai

# Start only frontend
frontend:
	docker-compose up -d fetchly-frontend

# View status
status:
	docker-compose ps