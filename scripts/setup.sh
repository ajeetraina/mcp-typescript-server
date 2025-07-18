#!/bin/bash

# MCP TypeScript Server Setup Script
# This script helps you get the server running quickly

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[SETUP]${NC} $1"
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

# Check Node.js version
check_node() {
    log "Checking Node.js version..."
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js 18+ first."
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        error "Node.js version must be 18 or higher. Current: $(node --version)"
    fi
    
    success "Node.js $(node --version) is ready"
}

# Check npm
check_npm() {
    log "Checking npm..."
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
    fi
    success "npm $(npm --version) is ready"
}

# Install dependencies
install_deps() {
    log "Installing dependencies..."
    npm install
    success "Dependencies installed"
}

# Create required directories
setup_dirs() {
    log "Creating required directories..."
    mkdir -p data temp logs
    success "Directories created: data/, temp/, logs/"
}

# Build the project
build_project() {
    log "Building TypeScript project..."
    npm run build
    success "Project built successfully"
}

# Run basic tests
run_tests() {
    log "Running basic tests..."
    if command -v npm test &> /dev/null; then
        npm test
        success "Tests passed"
    else
        warn "Test command not available, skipping tests"
    fi
}

# Verify setup
verify_setup() {
    log "Verifying setup..."
    
    if [ ! -d "dist" ]; then
        error "Build directory 'dist' not found"
    fi
    
    if [ ! -f "dist/server.js" ]; then
        error "Server file 'dist/server.js' not found"
    fi
    
    success "Setup verification complete"
}

# Show next steps
show_next_steps() {
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "  1. Start the server:        npm start"
    echo "  2. Start in dev mode:       npm run dev"
    echo "  3. Run with Docker:         docker-compose up"
    echo "  4. Run tests:               npm test"
    echo ""
    echo "Configuration:"
    echo "  - Edit config.json for settings"
    echo "  - Check data/ and temp/ directories"
    echo ""
    echo "Documentation:"
    echo "  - README.md for detailed instructions"
    echo "  - Check GitHub issues for help"
    echo ""
}

# Main execution
main() {
    echo "🚀 MCP TypeScript Server Setup"
    echo "==============================="
    echo ""
    
    check_node
    check_npm
    setup_dirs
    install_deps
    build_project
    verify_setup
    
    # Skip tests if --skip-tests flag is provided
    if [[ "$1" != "--skip-tests" ]]; then
        run_tests
    fi
    
    show_next_steps
}

# Run main function with all arguments
main "$@"