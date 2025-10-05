# Docker Setup for Incidents Reporting System

This document provides comprehensive instructions for running the Incidents Reporting System using Docker.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)
- Git

## Quick Start

### Development Environment

1. **Clone the repository and navigate to the project directory:**
   ```bash
   git clone <repository-url>
   cd incidents-report-system
   ```

2. **Create environment file:**
   ```bash
   cp env.development .env
   ```

3. **Start the development environment:**
   ```bash
   npm run docker:dev
   ```
   This will start:
   - PostgreSQL database on port 5433
   - Redis on port 6380
   - NestJS application on port 3000 (with hot reload)

4. **Access the application:**
   - API: http://localhost:3000
   - Health check: http://localhost:3000/health

### Production Environment

1. **Create production environment file:**
   ```bash
   cp env.example .env
   # Edit .env with your production values
   ```

2. **Start the production environment:**
   ```bash
   npm run docker:prod
   ```
   This will start:
   - PostgreSQL database
   - Redis
   - NestJS application
   - Nginx reverse proxy on port 80

3. **Access the application:**
   - API: http://localhost
   - Health check: http://localhost/health

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run docker:build` | Build the Docker image |
| `npm run docker:run` | Run the container locally |
| `npm run docker:dev` | Start development environment |
| `npm run docker:dev:down` | Stop development environment |
| `npm run docker:prod` | Start production environment |
| `npm run docker:prod:down` | Stop production environment |
| `npm run docker:logs` | View container logs |
| `npm run docker:clean` | Clean up Docker resources |

## Environment Configuration

### Environment Variables

The application uses environment variables for configuration. Copy the appropriate template:

**For Development:**
```bash
cp env.development .env
```

**For Production:**
```bash
cp env.example .env
# Edit .env with your production values
```

### Required Environment Variables

**Production Environment Variables:**
```env
# Database Configuration
DATABASE_HOST=your-db-host
DATABASE_PORT=5432
DATABASE_USERNAME=your-db-username
DATABASE_PASSWORD=your-secure-db-password
DATABASE_NAME=your-db-name

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
ENCRYPTION_KEY=your-encryption-key

# Redis Configuration
REDIS_HOST=your-redis-host
REDIS_PORT=6379
```

**Development Environment Variables:**
```env
# Development Database Configuration
DEV_DATABASE_HOST=postgres-dev
DEV_DATABASE_PORT=5432
DEV_DATABASE_USERNAME=postgres
DEV_DATABASE_PASSWORD=postgres
DEV_DATABASE_NAME=incidents_dev

# Development Security Configuration
DEV_JWT_SECRET=dev-jwt-secret-key
DEV_JWT_REFRESH_SECRET=dev-refresh-secret-key
DEV_ENCRYPTION_KEY=dev-encryption-key

# Development Redis Configuration
DEV_REDIS_HOST=redis-dev
DEV_REDIS_PORT=6379
```

## Database Setup

### Initial Setup

1. **Start the containers:**
   ```bash
   npm run docker:dev
   ```

2. **Run database migrations and seed data:**
   ```bash
   # Wait for containers to be healthy, then run:
   docker exec -it incidents-app-dev npm run seed
   ```

### Database Access

- **Development:** `psql -h localhost -p 5433 -U postgres -d incidents_dev`
- **Production:** `psql -h localhost -p 5432 -U your-db-user -d your-db-name`

## Container Details

### Services

| Service | Container Name | Port | Description |
|---------|----------------|------|-------------|
| App (Dev) | incidents-app-dev | 3000 | NestJS application with hot reload |
| App (Prod) | incidents-app | 3000 | Production NestJS application |
| PostgreSQL (Dev) | incidents-postgres-dev | 5433 | Development database |
| PostgreSQL (Prod) | incidents-postgres | 5432 | Production database |
| Redis (Dev) | incidents-redis-dev | 6380 | Development cache |
| Redis (Prod) | incidents-redis | 6379 | Production cache |
| Nginx | incidents-nginx | 80, 443 | Reverse proxy and load balancer |

### Health Checks

All containers include health checks:

- **Application:** HTTP GET to `/health`
- **PostgreSQL:** `pg_isready` command
- **Redis:** `redis-cli ping` command

## Monitoring and Logs

### View Logs

```bash
# All services
npm run docker:logs

# Specific service
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Container Status

```bash
# Check container status
docker-compose ps

# Check health status
docker inspect incidents-app-dev --format='{{.State.Health.Status}}'
```

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   - Development uses ports 3000, 5433, 6380
   - Production uses ports 80, 5432, 6379
   - Ensure these ports are available

2. **Database connection issues:**
   - Wait for PostgreSQL to be healthy before starting the app
   - Check database credentials in environment variables

3. **Permission issues:**
   - Ensure Docker has proper permissions
   - On Linux, you might need to add your user to the docker group

### Reset Everything

```bash
# Stop all containers and remove volumes
npm run docker:prod:down
docker volume prune -f

# Clean up Docker resources
npm run docker:clean

# Start fresh
npm run docker:prod
```

## Security Considerations

### Production Deployment

1. **Environment Variables Security:**
   - **NEVER** commit `.env` files to version control
   - Use strong, unique passwords for all services
   - Generate secure JWT secrets (minimum 32 characters)
   - Use strong encryption keys (minimum 32 characters)
   - Rotate secrets regularly

2. **Database Security:**
   - Use strong database passwords
   - Limit database access to application containers only
   - Enable SSL/TLS for database connections
   - Regular database backups

3. **Network Security:**
   - Use Docker networks for internal communication
   - Expose only necessary ports
   - Configure firewall rules
   - Use reverse proxy (Nginx) for external access

4. **SSL/TLS:**
   - Add SSL certificates to the nginx configuration
   - Enable HTTPS in production
   - Use Let's Encrypt for free SSL certificates

5. **Container Security:**
   - Run containers as non-root users
   - Use minimal base images (Alpine Linux)
   - Keep images updated
   - Scan images for vulnerabilities

### Environment Variables Best Practices

- **Development:** Use `env.development` template with safe defaults
- **Production:** Use `env.example` template and customize with secure values
- **Secrets Management:** Consider using Docker secrets or external secret management systems
- **Validation:** Ensure all required environment variables are set before starting containers

## Performance Optimization

### Resource Limits

Add resource limits to docker-compose.yml:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

### Caching

- Redis is configured for caching
- Nginx includes gzip compression
- Static assets are served efficiently

## Backup and Recovery

### Database Backup

```bash
# Create backup
docker exec incidents-postgres pg_dump -U postgres incidents_dev > backup.sql

# Restore backup
docker exec -i incidents-postgres psql -U postgres incidents_dev < backup.sql
```

### Volume Backup

```bash
# Backup volumes
docker run --rm -v incidents_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .
```

## Scaling

### Horizontal Scaling

To scale the application:

```bash
# Scale the app service
docker-compose up --scale app=3 -d
```

### Load Balancing

Nginx is configured to load balance multiple app instances automatically.

## Support

For issues or questions:

1. Check the logs: `npm run docker:logs`
2. Verify container health: `docker-compose ps`
3. Review this documentation
4. Check the main README.md for application-specific issues
