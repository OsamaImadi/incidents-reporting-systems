# Incidents Reporting System

A comprehensive NestJS-based application for reporting and managing security incidents with JWT authentication, role-based access control, audit logging, and data encryption.

## 🚀 Features

- **🔐 JWT Authentication** - Secure login with access and refresh tokens
- **👥 Role-Based Access Control** - Admin and User roles with different permissions
- **📊 Incident Management** - Create, read, update, delete incidents with encryption
- **🔍 Search & Filtering** - Advanced search and filtering capabilities
- **📝 Audit Logging** - Comprehensive audit trail for all actions
- **🛡️ Security Features** - Rate limiting, input validation, data encryption
- **🐳 Docker Support** - Full containerization with Docker and Docker Compose
- **🧪 Testing** - Comprehensive unit and integration tests
- **📈 Health Monitoring** - Health check endpoints and monitoring

## 📋 Prerequisites

### For Local Development (Without Docker)
- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL (v15 or higher)
- Redis (v7 or higher) - Optional

### For Docker Development
- Docker (v20.10 or higher)
- Docker Compose (v2.0 or higher)

## 🛠️ Installation

### Clone the Repository
```bash
git clone <repository-url>
cd incidents-report-system
```

### Install Dependencies
```bash
npm install
```

## 🏃‍♂️ Running the Application

### Option 1: Local Development (Without Docker)

#### 1. Database Setup
```bash
# Start PostgreSQL (if not running)
# On macOS with Homebrew:
brew services start postgresql

# On Ubuntu/Debian:
sudo systemctl start postgresql

# Create database
createdb incidents_db
```

#### 2. Environment Configuration
```bash
# Copy environment template
cp env.example .env

# Edit .env with your local database credentials
# Update these values in .env:
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
DATABASE_NAME=incidents_db
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
ENCRYPTION_KEY=your-encryption-key
```

#### 3. Database Migration and Seeding
```bash
# Run database migrations (if using TypeORM migrations)
npm run migration:run

# Seed the database with initial data
npm run seed
```

#### 4. Start the Application
```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

#### 5. Access the Application
- **API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **API Documentation**: http://localhost:3000/api (if Swagger is configured)

### Option 2: Docker Development

#### 1. Quick Setup
```bash
# Use the setup script (recommended)
chmod +x setup-env.sh
./setup-env.sh

# Or manually copy environment file
cp env.development .env
```

#### 2. Start Development Environment
```bash
# Start all services (PostgreSQL, Redis, App)
npm run docker:dev

# Or using docker-compose directly
docker-compose -f docker-compose.dev.yml up --build
```

#### 3. Access the Application
- **API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **PostgreSQL**: localhost:5433
- **Redis**: localhost:6380

### Option 3: Docker Production

#### 1. Environment Setup
```bash
# Copy production environment template
cp env.example .env

# Edit .env with your production values
# IMPORTANT: Change all default passwords and secrets!
```

#### 2. Start Production Environment
```bash
# Start all services (PostgreSQL, Redis, App, Nginx)
npm run docker:prod

# Or using docker-compose directly
docker-compose up --build -d
```

#### 3. Access the Application
- **API**: http://localhost (via Nginx)
- **Health Check**: http://localhost/health
- **Direct App**: http://localhost:3000

## 📚 Available Scripts

### Development Scripts
```bash
npm run start:dev          # Start in development mode with hot reload
npm run start:debug        # Start in debug mode
npm run build              # Build the application
npm run start:prod         # Start in production mode
```

### Testing Scripts
```bash
npm test                   # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run tests with coverage
npm run test:e2e           # Run end-to-end tests
```

### Database Scripts
```bash
npm run seed               # Seed database with initial data
```

### Docker Scripts
```bash
npm run docker:build       # Build Docker image
npm run docker:run         # Run container locally
npm run docker:dev         # Start development environment
npm run docker:dev:down    # Stop development environment
npm run docker:prod        # Start production environment
npm run docker:prod:down   # Stop production environment
npm run docker:logs        # View container logs
npm run docker:clean       # Clean up Docker resources
```

## 🔧 Configuration

### Environment Variables

#### Required Variables
```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
DATABASE_NAME=your_database

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# Encryption Configuration
ENCRYPTION_KEY=your-encryption-key
```

#### Optional Variables
```env
# Application Configuration
NODE_ENV=development
PORT=3000

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=10
```

### Database Configuration

The application uses TypeORM with PostgreSQL. Database configuration is handled through environment variables and the `src/config/database.config.ts` file.

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:cov
```

### Run Specific Test Suites
```bash
# Unit tests only
npm test -- --testPathPattern=src

# Integration tests only
npm run test:e2e
```

### Test Coverage
The test suite includes:
- ✅ **Service Layer Tests** - Business logic testing
- ✅ **Controller Layer Tests** - API endpoint testing
- ✅ **Authentication Tests** - JWT and security testing
- ✅ **Database Tests** - Entity and repository testing
- ✅ **Utility Tests** - Helper function testing

## 📖 API Documentation

### Authentication Endpoints
```bash
POST /auth/register          # Register new user
POST /auth/register/admin    # Register admin user (admin only)
POST /auth/login             # User login
POST /auth/refresh           # Refresh access token
GET  /auth/profile           # Get user profile
```

### User Management Endpoints
```bash
GET    /users                # Get all users (admin only)
POST   /users                # Create user (admin only)
GET    /users/:id            # Get user by ID
PATCH  /users/:id            # Update user
DELETE /users/:id            # Delete user
```

### Incident Management Endpoints
```bash
GET    /incidents            # Get incidents (filtered by user role)
POST   /incidents            # Create incident
GET    /incidents/search     # Search incidents with filters
GET    /incidents/user/:id   # Get incidents by user
GET    /incidents/:id        # Get incident by ID
PATCH  /incidents/:id        # Update incident
DELETE /incidents/:id        # Delete incident
```

### Audit Log Endpoints
```bash
GET /audit/logs              # Get all audit logs (admin only)
GET /audit/my-logs           # Get user's audit logs
```

### Health Check
```bash
GET /health                  # Application health status
```

## 🔐 Security Features

### Authentication & Authorization
- JWT-based authentication with access and refresh tokens
- Role-based access control (Admin/User)
- Password hashing with bcrypt
- Token expiration and refresh mechanism

### Data Protection
- AES encryption for sensitive incident data
- Input validation and sanitization
- SQL injection prevention
- XSS protection

### Rate Limiting
- Login attempt rate limiting
- API endpoint rate limiting
- Configurable limits per endpoint

### Audit Logging
- Comprehensive audit trail
- Failed login attempt logging
- User action tracking
- IP address and user agent logging

## 🐳 Docker Details

### Development Environment
- **PostgreSQL**: Port 5433
- **Redis**: Port 6380
- **Application**: Port 3000
- **Hot Reload**: Enabled
- **Volume Mounting**: Source code mounted for development

### Production Environment
- **PostgreSQL**: Internal network
- **Redis**: Internal network
- **Application**: Port 3000 (internal)
- **Nginx**: Ports 80/443 (external)
- **Health Checks**: Enabled for all services
- **Resource Limits**: Configurable

### Docker Commands
```bash
# Build and run development environment
docker-compose -f docker-compose.dev.yml up --build

# Build and run production environment
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Clean up
docker system prune -f
```

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Check database credentials in .env
# Ensure database exists
createdb your_database_name
```

#### Port Conflicts
```bash
# Check if ports are in use
netstat -tulpn | grep :3000
netstat -tulpn | grep :5432

# Kill process using port (Linux/macOS)
sudo lsof -ti:3000 | xargs kill -9
```

#### Docker Issues
```bash
# Check Docker status
docker --version
docker-compose --version

# Check container status
docker-compose ps

# View container logs
docker-compose logs app

# Reset Docker environment
docker-compose down -v
docker system prune -f
```

#### Environment Variables
```bash
# Check if .env file exists
ls -la .env

# Verify environment variables are loaded
node -e "console.log(process.env.DATABASE_HOST)"
```

### Getting Help

1. **Check the logs**: `npm run docker:logs` or `docker-compose logs`
2. **Verify environment**: Ensure all required environment variables are set
3. **Check health**: Visit `/health` endpoint
4. **Review documentation**: Check `DOCKER.md` for Docker-specific issues

## 📁 Project Structure

```
src/
├── auth/                   # Authentication module
│   ├── dto/               # Data transfer objects
│   ├── guards/            # Authentication guards
│   ├── strategies/        # Passport strategies
│   └── auth.service.ts    # Authentication service
├── users/                 # User management module
│   ├── dto/               # User DTOs
│   ├── entities/          # User entity
│   └── users.service.ts   # User service
├── incidents/             # Incident management module
│   ├── dto/               # Incident DTOs
│   ├── entities/          # Incident entity
│   ├── guards/            # Authorization guards
│   └── incidents.service.ts
├── audit/                 # Audit logging module
│   ├── entities/          # Audit log entity
│   ├── decorators/        # Audit decorators
│   └── audit.service.ts   # Audit service
├── config/                # Configuration files
├── database/              # Database setup and seeds
├── utils/                 # Utility functions and enums
└── main.ts                # Application entry point
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests: `npm test`
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## 📄 License

This project is licensed under the UNLICENSED License.

## 🆘 Support

For support and questions:
1. Check the troubleshooting section above
2. Review the `DOCKER.md` file for Docker-specific issues
3. Check the test files for usage examples
4. Create an issue in the repository

---

**Happy Coding! 🚀**