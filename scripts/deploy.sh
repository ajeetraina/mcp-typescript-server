#!/bin/bash

# MCP TypeScript Server Deployment Script
# This script handles building, testing, and deploying the MCP server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_IMAGE="mcp-typescript-server"
DOCKER_TAG="latest"
HEALTH_CHECK_URL="http://localhost:3000/health"
MAX_WAIT_TIME=60

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
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

# Check if Docker is installed and running
check_docker() {
    log "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker is not running. Please start Docker first."
    fi
    
    success "Docker is ready"
}

# Check if Node.js and npm are installed
check_node() {
    log "Checking Node.js installation..."
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js 18+ first."
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        error "Node.js version must be 18 or higher. Current version: $(node --version)"
    fi
    
    success "Node.js $(node --version) is ready"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    npm ci --silent
    success "Dependencies installed"
}

# Run linting
run_lint() {
    log "Running ESLint..."
    npm run lint
    success "Linting passed"
}

# Run tests
run_tests() {
    log "Running tests..."
    npm run test:coverage
    success "All tests passed"
}

# Build the application
build_app() {
    log "Building TypeScript application..."
    npm run clean
    npm run build
    success "Application built successfully"
}

# Build Docker image
build_docker() {
    log "Building Docker image..."
    docker build -t "${DOCKER_IMAGE}:${DOCKER_TAG}" .
    
    # Tag with timestamp
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    docker tag "${DOCKER_IMAGE}:${DOCKER_TAG}" "${DOCKER_IMAGE}:${TIMESTAMP}"
    
    success "Docker image built: ${DOCKER_IMAGE}:${DOCKER_TAG}"
    success "Docker image tagged: ${DOCKER_IMAGE}:${TIMESTAMP}"
}

# Test Docker image
test_docker() {
    log "Testing Docker image..."
    
    # Run container in background
    CONTAINER_ID=$(docker run -d -p 3000:3000 "${DOCKER_IMAGE}:${DOCKER_TAG}")
    
    log "Container started: $CONTAINER_ID"
    
    # Wait for container to be ready
    log "Waiting for container to be ready..."
    local wait_time=0
    while [ $wait_time -lt $MAX_WAIT_TIME ]; do
        if docker exec "$CONTAINER_ID" node -e "console.log('Container is ready')" &> /dev/null; then
            break
        fi
        sleep 2
        wait_time=$((wait_time + 2))
    done
    
    if [ $wait_time -ge $MAX_WAIT_TIME ]; then
        docker logs "$CONTAINER_ID"
        docker stop "$CONTAINER_ID" &> /dev/null
        docker rm "$CONTAINER_ID" &> /dev/null
        error "Container failed to start within ${MAX_WAIT_TIME} seconds"
    fi
    
    # Test basic functionality
    log "Testing container functionality..."
    sleep 5
    
    # Clean up
    docker stop "$CONTAINER_ID" &> /dev/null
    docker rm "$CONTAINER_ID" &> /dev/null
    
    success "Docker image test passed"
}

# Deploy with Docker Compose
deploy_compose() {
    log "Deploying with Docker Compose..."
    
    if [ ! -f "docker-compose.yml" ]; then
        error "docker-compose.yml not found"
    fi
    
    # Stop existing containers
    docker-compose down --remove-orphans
    
    # Start new containers
    docker-compose up -d
    
    # Wait for service to be ready
    log "Waiting for service to be ready..."
    local wait_time=0
    while [ $wait_time -lt $MAX_WAIT_TIME ]; do
        if docker-compose ps | grep -q "Up"; then
            break
        fi
        sleep 2
        wait_time=$((wait_time + 2))
    done
    
    if [ $wait_time -ge $MAX_WAIT_TIME ]; then
        docker-compose logs
        error "Service failed to start within ${MAX_WAIT_TIME} seconds"
    fi
    
    success "Service deployed successfully"
    log "You can check the logs with: docker-compose logs -f"
}

# Create deployment package
create_package() {
    log "Creating deployment package..."
    
    PACKAGE_NAME="mcp-typescript-server-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    tar -czf "$PACKAGE_NAME" \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=coverage \
        --exclude=.nyc_output \
        --exclude="*.tar.gz" \
        .
    
    success "Deployment package created: $PACKAGE_NAME"
}

# Show usage
show_usage() {
    echo "Usage: $0 [OPTIONS] [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build      - Build the application and Docker image"
    echo "  test       - Run tests and linting"
    echo "  deploy     - Deploy using Docker Compose"
    echo "  package    - Create deployment package"
    echo "  full       - Run complete deployment pipeline (default)"
    echo ""
    echo "Options:"
    echo "  --skip-tests     Skip running tests"
    echo "  --skip-docker    Skip Docker operations"
    echo "  --tag TAG        Docker image tag (default: latest)"
    echo "  --help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                           # Full deployment pipeline"
    echo "  $0 build                     # Only build"
    echo "  $0 deploy --skip-tests       # Deploy without testing"
    echo "  $0 build --tag v1.0.0        # Build with custom tag"
}

# Parse command line arguments
SKIP_TESTS=false
SKIP_DOCKER=false
COMMAND="full"

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-docker)
            SKIP_DOCKER=true
            shift
            ;;
        --tag)
            DOCKER_TAG="$2"
            shift 2
            ;;
        --help)
            show_usage
            exit 0
            ;;
        build|test|deploy|package|full)
            COMMAND="$1"
            shift
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# Main execution
log "Starting MCP TypeScript Server deployment..."
log "Command: $COMMAND"
log "Docker tag: $DOCKER_TAG"
log "Skip tests: $SKIP_TESTS"
log "Skip Docker: $SKIP_DOCKER"
echo ""

case $COMMAND in
    "test")
        check_node
        install_dependencies
        run_lint
        run_tests
        ;;
    "build")
        check_node
        install_dependencies
        if [ "$SKIP_TESTS" = false ]; then
            run_lint
            run_tests
        fi
        build_app
        if [ "$SKIP_DOCKER" = false ]; then
            check_docker
            build_docker
            test_docker
        fi
        ;;
    "deploy")
        if [ "$SKIP_DOCKER" = false ]; then
            check_docker
            deploy_compose
        else
            error "Cannot deploy without Docker"
        fi
        ;;
    "package")
        check_node
        install_dependencies
        build_app
        create_package
        ;;
    "full")
        check_node
        check_docker
        install_dependencies
        if [ "$SKIP_TESTS" = false ]; then
            run_lint
            run_tests
        fi
        build_app
        build_docker
        test_docker
        deploy_compose
        ;;
    *)
        error "Unknown command: $COMMAND"
        ;;
esac

echo ""
success "Deployment completed successfully! 🚀"
log "Docker image: ${DOCKER_IMAGE}:${DOCKER_TAG}"
log "To view logs: docker-compose logs -f"
log "To stop: docker-compose down"