#!/bin/bash

# Setup script for Incidents Reporting System Docker environment

echo "🚀 Setting up Incidents Reporting System Docker Environment"
echo "=========================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Check if .env file exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists. Do you want to overwrite it? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "📝 Overwriting .env file..."
    else
        echo "ℹ️  Keeping existing .env file"
        exit 0
    fi
fi

# Ask user for environment type
echo "🔧 Which environment do you want to set up?"
echo "1) Development"
echo "2) Production"
read -r -p "Enter your choice (1 or 2): " choice

case $choice in
    1)
        echo "📋 Setting up development environment..."
        cp env.development .env
        echo "✅ Development environment file created: .env"
        echo ""
        echo "🔑 Development environment uses these default values:"
        echo "   - Database: PostgreSQL on port 5433"
        echo "   - Redis: on port 6380"
        echo "   - App: on port 3000"
        echo "   - JWT secrets: dev-* (change these for security)"
        echo ""
        echo "🚀 To start the development environment, run:"
        echo "   npm run docker:dev"
        ;;
    2)
        echo "📋 Setting up production environment..."
        cp env.example .env
        echo "✅ Production environment file created: .env"
        echo ""
        echo "⚠️  IMPORTANT: You MUST edit .env file with your production values:"
        echo "   - Database credentials"
        echo "   - JWT secrets (use strong, random values)"
        echo "   - Encryption keys (use strong, random values)"
        echo ""
        echo "🔐 Generate secure secrets:"
        echo "   JWT_SECRET=$(openssl rand -base64 32)"
        echo "   JWT_REFRESH_SECRET=$(openssl rand -base64 32)"
        echo "   ENCRYPTION_KEY=$(openssl rand -base64 32)"
        echo ""
        echo "🚀 To start the production environment, run:"
        echo "   npm run docker:prod"
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again and choose 1 or 2."
        exit 1
        ;;
esac

echo ""
echo "📚 For more information, see DOCKER.md"
echo "🎉 Setup complete!"
