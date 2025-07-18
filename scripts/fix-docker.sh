#!/bin/bash

# Docker Fix Script for MCP TypeScript Server
# Resolves package-lock.json and Docker build issues

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[DOCKER-FIX]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Clean existing Docker artifacts
clean_docker() {
    log "Cleaning Docker artifacts..."
    
    # Stop and remove containers
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # Remove images
    docker rmi mcp-typescript-server 2>/dev/null || true
    docker rmi mcp-typescript-server-dev 2>/dev/null || true
    
    # Clean build cache
    docker builder prune -f
    
    success "Docker artifacts cleaned"
}

# Fix package lock file
fix_package_lock() {
    log "Fixing package-lock.json..."
    
    # Remove existing lock file and node_modules
    rm -rf node_modules package-lock.json
    
    # Generate new lock file
    npm install
    
    success "Package lock file regenerated"
}

# Create required directories
setup_directories() {
    log "Creating required directories..."
    mkdir -p data temp logs
    success "Directories created"
}

# Build with Docker
build_docker() {
    log "Building Docker image..."
    docker-compose build --no-cache
    success "Docker image built successfully"
}

# Test Docker container
test_docker() {
    log "Testing Docker container..."
    
    # Start container in detached mode
    docker-compose up -d
    
    # Wait for container to start
    sleep 10
    
    # Check if container is running
    if docker-compose ps | grep -q "Up"; then
        success "Container is running successfully"
        
        # Show logs
        log "Container logs:"
        docker-compose logs --tail=20
        
        # Stop container
        docker-compose down
    else
        error "Container failed to start"
    fi
}

# Main execution
main() {
    echo "🐳 Docker Fix for MCP TypeScript Server"
    echo "====================================="
    echo ""
    
    clean_docker
    fix_package_lock
    setup_directories
    build_docker
    test_docker
    
    echo ""
    success "Docker fix completed successfully!"
    echo ""
    echo "Next steps:"
    echo "  1. Start the server:    docker-compose up -d"
    echo "  2. View logs:           docker-compose logs -f"
    echo "  3. Stop the server:     docker-compose down"
    echo "  4. Development mode:    docker-compose --profile dev up"
    echo ""
}

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    error "Docker is not installed or not running"
fi

if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose is not installed"
fi

# Run main function
main "$@"