#!/bin/bash

# MCP TypeScript Server Test Script
# Comprehensive testing script for development and CI/CD

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Test configuration
TEST_TYPES=("unit" "integration" "load" "security")
SELECTED_TESTS=()
COVERAGE_THRESHOLD=70
VERBOSE=false
CI_MODE=false
PARALLEL=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --unit)
            SELECTED_TESTS+=("unit")
            shift
            ;;
        --integration)
            SELECTED_TESTS+=("integration")
            shift
            ;;
        --load)
            SELECTED_TESTS+=("load")
            shift
            ;;
        --security)
            SELECTED_TESTS+=("security")
            shift
            ;;
        --coverage)
            COVERAGE_THRESHOLD="$2"
            shift 2
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --ci)
            CI_MODE=true
            shift
            ;;
        --parallel)
            PARALLEL=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Test Types:"
            echo "  --unit         Run unit tests only"
            echo "  --integration  Run integration tests only"
            echo "  --load         Run load tests only"
            echo "  --security     Run security tests only"
            echo ""
            echo "Options:"
            echo "  --coverage N   Set coverage threshold (default: 70)"
            echo "  --verbose      Enable verbose output"
            echo "  --ci           Run in CI mode"
            echo "  --parallel     Run tests in parallel"
            echo "  --help         Show this help"
            echo ""
            echo "Examples:"
            echo "  $0                    # Run all tests"
            echo "  $0 --unit --verbose  # Run unit tests with verbose output"
            echo "  $0 --ci --coverage 80 # Run in CI mode with 80% coverage"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# If no specific tests selected, run all
if [ ${#SELECTED_TESTS[@]} -eq 0 ]; then
    SELECTED_TESTS=("${TEST_TYPES[@]}")
fi

# Setup test environment
setup_test_env() {
    log "Setting up test environment..."
    
    # Create test directories
    mkdir -p data temp logs coverage
    
    # Set test environment variables
    export NODE_ENV=test
    export DEBUG=false
    
    if [ "$CI_MODE" = true ]; then
        export CI=true
    fi
    
    success "Test environment ready"
}

# Install dependencies
install_deps() {
    log "Installing dependencies..."
    if [ "$CI_MODE" = true ]; then
        npm ci --silent
    else
        npm install --silent
    fi
    success "Dependencies installed"
}

# Build application
build_app() {
    log "Building application..."
    npm run build
    success "Application built"
}

# Run linting
run_lint() {
    log "Running ESLint..."
    if [ "$VERBOSE" = true ]; then
        npm run lint
    else
        npm run lint > /dev/null 2>&1
    fi
    success "Linting passed"
}

# Run type checking
run_typecheck() {
    log "Running TypeScript type checking..."
    if [ "$VERBOSE" = true ]; then
        npx tsc --noEmit
    else
        npx tsc --noEmit > /dev/null 2>&1
    fi
    success "Type checking passed"
}

# Run unit tests
run_unit_tests() {
    log "Running unit tests..."
    
    local jest_args="--testPathPattern=tests/.*\\.(test|spec)\\.ts$"
    jest_args="$jest_args --testPathIgnorePatterns=integration.test.ts,load.test.ts"
    
    if [ "$VERBOSE" = true ]; then
        jest_args="$jest_args --verbose"
    fi
    
    if [ "$PARALLEL" = true ]; then
        jest_args="$jest_args --maxWorkers=50%"
    else
        jest_args="$jest_args --runInBand"
    fi
    
    npx jest $jest_args
    success "Unit tests passed"
}

# Run integration tests
run_integration_tests() {
    log "Running integration tests..."
    
    # Build first if not already built
    if [ ! -d "dist" ]; then
        build_app
    fi
    
    local jest_args="--testPathPattern=integration.test.ts"
    
    if [ "$VERBOSE" = true ]; then
        jest_args="$jest_args --verbose"
    fi
    
    npx jest $jest_args --runInBand
    success "Integration tests passed"
}

# Run load tests
run_load_tests() {
    log "Running load tests..."
    
    local jest_args="--testPathPattern=load.test.ts"
    
    if [ "$VERBOSE" = true ]; then
        jest_args="$jest_args --verbose"
    fi
    
    npx jest $jest_args --runInBand --testTimeout=60000
    success "Load tests passed"
}

# Run security tests
run_security_tests() {
    log "Running security tests..."
    
    # NPM audit
    log "Running npm audit..."
    if ! npm audit --audit-level=moderate; then
        warn "NPM audit found vulnerabilities"
    fi
    
    # Check for hardcoded secrets (basic check)
    log "Checking for potential secrets..."
    if grep -r -i "password\|secret\|key\|token" src/ --include="*.ts" | grep -v "password" | grep -v "// " | grep -v "\*" > /dev/null; then
        warn "Potential secrets found in source code"
        if [ "$VERBOSE" = true ]; then
            grep -r -i "password\|secret\|key\|token" src/ --include="*.ts" | grep -v "password" | grep -v "// " | grep -v "\*"
        fi
    fi
    
    success "Security tests completed"
}

# Generate coverage report
generate_coverage() {
    log "Generating coverage report..."
    
    local jest_args="--coverage --coverageDirectory=coverage"
    jest_args="$jest_args --coverageReporters=text,lcov,html"
    jest_args="$jest_args --coverageThreshold='{\"global\":{\"branches\":$COVERAGE_THRESHOLD,\"functions\":$COVERAGE_THRESHOLD,\"lines\":$COVERAGE_THRESHOLD,\"statements\":$COVERAGE_THRESHOLD}}'"
    
    if [ "$PARALLEL" = true ]; then
        jest_args="$jest_args --maxWorkers=50%"
    else
        jest_args="$jest_args --runInBand"
    fi
    
    npx jest $jest_args
    
    success "Coverage report generated"
    
    if [ "$VERBOSE" = true ]; then
        log "Coverage report available at: file://$(pwd)/coverage/lcov-report/index.html"
    fi
}

# Performance profiling
run_performance_profile() {
    log "Running performance profiling..."
    
    # Basic memory usage test
    node -e "
        const { MCPTypeScriptServer } = require('./dist/server.js');
        const startMem = process.memoryUsage();
        console.log('Starting memory:', Math.round(startMem.heapUsed / 1024 / 1024), 'MB');
        
        const server = new MCPTypeScriptServer();
        
        const endMem = process.memoryUsage();
        console.log('Final memory:', Math.round(endMem.heapUsed / 1024 / 1024), 'MB');
        console.log('Memory increase:', Math.round((endMem.heapUsed - startMem.heapUsed) / 1024 / 1024), 'MB');
    "
    
    success "Performance profiling completed"
}

# Cleanup
cleanup() {
    log "Cleaning up test environment..."
    
    # Remove test files
    rm -rf temp/test-* 2>/dev/null || true
    
    # Reset environment
    unset NODE_ENV DEBUG CI
    
    success "Cleanup completed"
}

# Main execution
main() {
    log "Starting test suite..."
    log "Selected tests: ${SELECTED_TESTS[*]}"
    log "Coverage threshold: $COVERAGE_THRESHOLD%"
    log "Verbose mode: $VERBOSE"
    log "CI mode: $CI_MODE"
    log "Parallel execution: $PARALLEL"
    echo ""
    
    # Setup
    setup_test_env
    install_deps
    
    # Always run linting and type checking
    run_lint
    run_typecheck
    
    # Run selected tests
    for test_type in "${SELECTED_TESTS[@]}"; do
        case $test_type in
            "unit")
                run_unit_tests
                ;;
            "integration")
                run_integration_tests
                ;;
            "load")
                run_load_tests
                ;;
            "security")
                run_security_tests
                ;;
        esac
    done
    
    # Generate coverage if running unit tests
    if [[ " ${SELECTED_TESTS[*]} " =~ " unit " ]]; then
        generate_coverage
    fi
    
    # Run performance profiling in verbose mode
    if [ "$VERBOSE" = true ] && [ -d "dist" ]; then
        run_performance_profile
    fi
    
    # Cleanup
    cleanup
    
    echo ""
    success "All tests completed successfully! ✅"
    
    if [ "$VERBOSE" = true ]; then
        log "Test artifacts available in:"
        log "  - Coverage: ./coverage/lcov-report/index.html"
        log "  - Logs: ./logs/"
    fi
}

# Run main function
main "$@"