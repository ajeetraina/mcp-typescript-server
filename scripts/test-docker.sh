#!/bin/bash

# Docker Test Script for MCP TypeScript Server
# Tests Docker functionality and common scenarios

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[DOCKER-TEST]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    return 1
}

# Test Docker availability
test_docker_available() {
    log "Testing Docker availability..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        return 1
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker is not running"
        return 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
        return 1
    fi
    
    success "Docker and Docker Compose are available"
}

# Test build process
test_build() {
    log "Testing Docker build..."
    
    # Clean previous builds
    docker-compose down --remove-orphans 2>/dev/null || true
    docker rmi mcp-typescript-server 2>/dev/null || true
    
    # Build with no cache
    if docker-compose build --no-cache; then
        success "Docker build completed successfully"
    else
        error "Docker build failed"
        return 1
    fi
}

# Test container startup
test_startup() {
    log "Testing container startup..."
    
    # Start in detached mode
    docker-compose up -d
    
    # Wait for container to start
    sleep 15
    
    # Check if container is running
    if docker-compose ps | grep -q "Up"; then
        success "Container started successfully"
    else
        error "Container failed to start"
        docker-compose logs
        return 1
    fi
}

# Test health check
test_health() {
    log "Testing container health..."
    
    # Wait for health check to pass
    local attempts=0
    local max_attempts=12
    
    while [ $attempts -lt $max_attempts ]; do
        if docker inspect --format='{{.State.Health.Status}}' mcp-typescript-server 2>/dev/null | grep -q "healthy"; then
            success "Container is healthy"
            return 0
        fi
        
        sleep 5
        attempts=$((attempts + 1))
        log "Waiting for health check... ($attempts/$max_attempts)"
    done
    
    warn "Health check did not pass within expected time"
    docker inspect --format='{{json .State.Health}}' mcp-typescript-server
}

# Test basic functionality
test_functionality() {
    log "Testing basic functionality..."
    
    # Test if Node.js is working inside container
    if docker exec mcp-typescript-server node -e "console.log('Node.js is working')"; then
        success "Node.js is functional inside container"
    else
        error "Node.js test failed"
        return 1
    fi
    
    # Test if server files are present
    if docker exec mcp-typescript-server ls dist/server.js; then
        success "Server files are present"
    else
        error "Server files are missing"
        return 1
    fi
    
    # Test if config is accessible
    if docker exec mcp-typescript-server cat config.json > /dev/null; then
        success "Configuration is accessible"
    else
        error "Configuration is not accessible"
        return 1
    fi
}

# Test logs
test_logs() {
    log "Testing log output..."
    
    # Get recent logs
    local logs=$(docker-compose logs --tail=20 2>&1)
    
    if echo "$logs" | grep -q "MCP TypeScript Server"; then
        success "Server logs are being generated"
    else
        warn "Expected log messages not found"
        echo "Recent logs:"
        echo "$logs"
    fi
}

# Test cleanup
test_cleanup() {
    log "Testing cleanup..."
    
    # Stop and remove containers
    docker-compose down --remove-orphans
    
    # Check if containers are stopped
    if ! docker-compose ps | grep -q "Up"; then
        success "Containers stopped successfully"
    else
        warn "Some containers may still be running"
    fi
}

# Test development mode
test_dev_mode() {
    log "Testing development mode..."
    
    # Start dev profile
    docker-compose --profile dev up -d
    
    sleep 10
    
    # Check if dev container is running
    if docker-compose ps | grep -q "mcp-typescript-server-dev.*Up"; then
        success "Development mode container is running"
        docker-compose --profile dev down
    else
        warn "Development mode test failed"
        docker-compose --profile dev logs
        docker-compose --profile dev down
    fi
}

# Test volumes
test_volumes() {
    log "Testing volume mounts..."
    
    # Start container
    docker-compose up -d
    sleep 5
    
    # Test data directory
    if docker exec mcp-typescript-server ls -la /app/data; then
        success "Data volume is mounted"
    else
        warn "Data volume mount test failed"
    fi
    
    # Test config volume
    if docker exec mcp-typescript-server test -f /app/config.json; then
        success "Config volume is mounted"
    else
        warn "Config volume mount test failed"
    fi
    
    docker-compose down
}

# Test environment variables
test_environment() {
    log "Testing environment variables..."
    
    # Start with custom env vars
    NODE_ENV=test MCP_RATE_LIMIT=30 docker-compose up -d
    sleep 5
    
    # Check environment variables
    local node_env=$(docker exec mcp-typescript-server printenv NODE_ENV)
    local rate_limit=$(docker exec mcp-typescript-server printenv MCP_RATE_LIMIT)
    
    if [ "$node_env" = "test" ] && [ "$rate_limit" = "30" ]; then
        success "Environment variables are set correctly"
    else
        warn "Environment variable test failed: NODE_ENV=$node_env, MCP_RATE_LIMIT=$rate_limit"
    fi
    
    docker-compose down
}

# Show summary
show_summary() {
    echo ""
    echo "🏁 Docker Test Summary"
    echo "====================="
    echo ""
    echo "Tests completed. Check the output above for any failures or warnings."
    echo ""
    echo "Next steps:"
    echo "  1. If all tests passed: docker-compose up -d"
    echo "  2. If tests failed: ./scripts/fix-docker.sh"
    echo "  3. View logs: docker-compose logs -f"
    echo "  4. Stop server: docker-compose down"
    echo ""
}

# Main execution
main() {
    echo "🐳 Docker Test Suite for MCP TypeScript Server"
    echo "============================================="
    echo ""
    
    # Run all tests
    test_docker_available || exit 1
    test_build || exit 1
    test_startup || exit 1
    test_health
    test_functionality || exit 1
    test_logs
    test_cleanup
    test_dev_mode
    test_volumes
    test_environment
    
    show_summary
}

# Allow running individual tests
if [ "$1" = "--build-only" ]; then
    test_docker_available && test_build
elif [ "$1" = "--startup-only" ]; then
    test_docker_available && test_startup && test_health && test_functionality
elif [ "$1" = "--cleanup" ]; then
    test_cleanup
else
    main "$@"
fi