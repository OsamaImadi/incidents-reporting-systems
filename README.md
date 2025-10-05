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

### For Local Development 
- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL (v15 or higher)



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

### Option 1: Local Development

```

#### 2. Environment Configuration
```bash

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

