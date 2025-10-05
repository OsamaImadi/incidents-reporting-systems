# 🚀 Quick Start Guide

Get the Incidents Reporting System up and running in minutes!

## Option 1: Docker (Recommended for Beginners)

### 1. Prerequisites
- Docker Desktop installed and running
- Git

### 2. Clone and Setup
```bash
git clone <repository-url>
cd incidents-report-system
```

### 3. Start Development Environment
```bash
# Copy development environment
cp env.development .env

# Start all services
npm run docker:dev
```

### 4. Access the Application
- **API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

### 5. Seed Database (Optional)
```bash
# In another terminal
docker exec -it incidents-app-dev npm run seed
```

## Option 2: Local Development

### 1. Prerequisites
- Node.js 18+
- PostgreSQL 15+
- npm

### 2. Setup
```bash
git clone <repository-url>
cd incidents-report-system
npm install
```

### 3. Database Setup
```bash
# Create database
createdb incidents_db

# Copy environment file
cp env.example .env
# Edit .env with your database credentials
```

### 4. Start Application
```bash
# Seed database
npm run seed

# Start development server
npm run start:dev
```

### 5. Access the Application
- **API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## 🧪 Test the API

### 1. Register a User
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. Create an Incident (with token from login)
```bash
curl -X POST http://localhost:3000/incidents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "url": "http://malicious-site.com",
    "description": "Suspicious website detected",
    "severity": "HIGH"
  }'
```

## 🔑 Default Admin User

If you run the seed script, you'll have a default admin user:
- **Email**: admin@incidents.com
- **Username**: admin
- **Password**: admin123

## 🆘 Need Help?

- **Full Documentation**: See `README.md`
- **Docker Details**: See `DOCKER.md`
- **API Endpoints**: Check the API documentation section in README.md
- **Troubleshooting**: See the troubleshooting section in README.md

## 🎉 You're Ready!

Your Incidents Reporting System is now running! Start exploring the API endpoints and building your incident management workflow.
