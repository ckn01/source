-- -- Create databases for backend and AI service
CREATE DATABASE fetchly_backend;
CREATE DATABASE fetchly_ai;

-- -- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE fetchly_backend TO fetchly_user;
GRANT ALL PRIVILEGES ON DATABASE fetchly_ai TO fetchly_user;