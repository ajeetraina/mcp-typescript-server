#!/bin/bash

# Docker Build Fix Script
# This script fixes common Docker build issues

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

# Clean up existing containers and images
cleanup_docker() {
    log "Cleaning up existing Docker resources..."
    
    # Stop and remove containers
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # Remove any existing images
    docker rmi mcp-typescript-server:latest 2>/dev/null || true
    docker rmi $(docker images -q "*mcp-typescript-server*") 2>/dev/null || true
    
    # Prune build cache
    docker builder prune -f
    
    success "Docker cleanup completed"
}

# Fix package lock issues
fix_package_lock() {
    log "Fixing package lock issues..."
    
    # Remove lock files that might cause conflicts
    rm -f package-lock.json
    rm -f yarn.lock
    
    success "Package lock files cleaned"
}

# Build with no cache
build_fresh() {
    log "Building Docker image with no cache..."
    
    docker-compose build --no-cache --progress=plain
    
    success "Fresh build completed"
}

# Test the build
test_build() {
    log "Testing the Docker build..."
    
    # Start containers
    docker-compose up -d
    
    # Wait for containers to start
    sleep 10
    
    # Check if containers are running
    if docker-compose ps | grep -q "Up"; then
        success "Containers are running successfully"
        
        # Show logs
        log "Container logs:"
        docker-compose logs --tail=20
        
        # Stop containers
        docker-compose down
    else
        error "Containers failed to start"
    fi
}

# Main execution
main() {
    echo "🐳 Docker Build Fix Script"
    echo "========================="
    echo ""
    
    cleanup_docker
    fix_package_lock
    build_fresh
    test_build
    
    echo ""
    success "Docker build fix completed! 🎉"
    echo ""
    echo "Next steps:"
    echo "  1. Run: docker-compose up -d"
    echo "  2. Check logs: docker-compose logs -f"
    echo "  3. Test the server: docker-compose exec mcp-server node -e \"console.log('OK')\""
    echo ""
}

# Run with error handling
trap 'error "Script failed on line $LINENO"' ERR
main "$@"