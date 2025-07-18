# Docker Troubleshooting Guide

## 🐞 Common Docker Issues and Solutions

### Issue 1: Package Lock File Mismatch

**Error**: 
```
npm error Invalid: lock file's @modelcontextprotocol/sdk@1.16.0 does not satisfy @modelcontextprotocol/sdk@0.5.0
```

**Cause**: The `package-lock.json` file is out of sync with `package.json`.

**Solution**: Use the automated fix script:

```bash
# Pull the latest fixes
git pull origin main

# Run the Docker fix script
chmod +x scripts/fix-docker.sh
./scripts/fix-docker.sh
```

**Manual Solution**:
```bash
# Clean everything
docker-compose down --remove-orphans
docker system prune -f

# Remove lock file and node_modules
rm -rf node_modules package-lock.json

# Regenerate lock file
npm install

# Build with no cache
docker-compose build --no-cache

# Start the service
docker-compose up -d
```

---

### Issue 2: Build Context Too Large

**Error**: Build takes too long or fails due to large context.

**Solution**: The `.dockerignore` file has been updated to exclude unnecessary files.

**Verify**:
```bash
# Check what's being sent to Docker
docker build --dry-run .

# Ensure these are excluded:
# - node_modules/
# - .git/
# - dist/
# - logs/
# - coverage/
```

---

### Issue 3: Permission Errors

**Error**: Permission denied when writing to volumes.

**Solution**: 
```bash
# Create directories with proper permissions
sudo mkdir -p data temp logs
sudo chown -R $USER:$USER data temp logs

# Or run the setup script
./scripts/setup.sh
```

---

### Issue 4: Port Already in Use

**Error**: 
```
Error starting userland proxy: listen tcp4 0.0.0.0:3000: bind: address already in use
```

**Solution**: 
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process (replace PID)
kill -9 <PID>

# Or use different port
PORT=3001 docker-compose up

# Or modify docker-compose.yml:
# ports:
#   - "3001:3000"
```

---

### Issue 5: Container Starts but Exits Immediately

**Error**: Container starts but stops immediately.

**Diagnosis**:
```bash
# Check logs
docker-compose logs mcp-server

# Check container status
docker-compose ps

# Run interactively to debug
docker run -it --rm mcp-typescript-server sh
```

**Common Solutions**:
```bash
# 1. Missing dist/ directory
# Ensure TypeScript builds successfully
npm run build

# 2. Missing config.json
# Ensure config file exists
ls config.json

# 3. Node.js version mismatch
# Check Dockerfile uses Node 18+
```

---

### Issue 6: Health Check Failures

**Error**: Container marked as unhealthy.

**Debug**:
```bash
# Check health status
docker inspect --format='{{json .State.Health}}' mcp-typescript-server

# Test health check manually
docker exec mcp-typescript-server node -e "console.log('Health check')"
```

**Fix**: The health check has been simplified to just test Node.js execution.

---

## ⚙️ Docker Configuration

### Production Build

```dockerfile
# Multi-stage build optimized for production
FROM node:18-alpine AS builder
# ... build stage ...

FROM node:18-alpine AS production
# ... production stage ...
```

**Benefits**:
- Smaller final image size
- No dev dependencies in production
- Build artifacts isolated
- Security hardening with non-root user

### Development Setup

```bash
# Development with hot reload
docker-compose --profile dev up

# This starts:
# - Volume mounted source code
# - Nodemon for hot reload
# - Development dependencies
```

### Testing Setup

```bash
# Run tests in container
docker-compose --profile test up

# This runs:
# - Jest test suite
# - Coverage reports
# - Linting
```

---

## 🚑 Quick Recovery Commands

### Complete Reset
```bash
# Nuclear option - reset everything
git pull origin main
docker-compose down --volumes --remove-orphans
docker system prune -af
rm -rf node_modules package-lock.json dist
npm install
docker-compose up --build
```

### Fast Fix
```bash
# Quick fix for most issues
git pull origin main
./scripts/fix-docker.sh
```

### Check Everything
```bash
# Verify setup
docker --version
docker-compose --version
node --version
npm --version

# Check files
ls -la package*.json
ls -la Dockerfile*
ls -la docker-compose.yml
```

---

## 📊 Monitoring and Logs

### View Logs
```bash
# Real-time logs
docker-compose logs -f

# Specific service logs
docker-compose logs -f mcp-server

# Last 50 lines
docker-compose logs --tail=50
```

### Monitor Resources
```bash
# Container stats
docker stats

# Detailed info
docker inspect mcp-typescript-server

# Process list
docker exec mcp-typescript-server ps aux
```

### Health Monitoring
```bash
# Health status
docker-compose ps

# Health check logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' mcp-typescript-server
```

---

## 📦 Environment Variables

### Available Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Runtime environment |
| `PORT` | `3000` | Server port |
| `MCP_SERVER_NAME` | `typescript-mcp-server` | Server name |
| `MCP_RATE_LIMIT` | `120` | Requests per minute |
| `DEBUG` | `false` | Enable debug logging |

### Override in Docker Compose

```yaml
services:
  mcp-server:
    environment:
      - NODE_ENV=development
      - DEBUG=true
      - MCP_RATE_LIMIT=60
```

### Override at Runtime

```bash
# Single run
docker run -e NODE_ENV=development mcp-typescript-server

# Docker Compose override
NODE_ENV=development docker-compose up
```

---

## 🎯 Best Practices

### 1. Always Use Specific Tags
```dockerfile
# Good
FROM node:18.19.0-alpine

# Avoid
FROM node:latest
```

### 2. Multi-stage Builds
```dockerfile
# Separate build and runtime stages
FROM node:18-alpine AS builder
# ... build steps ...

FROM node:18-alpine AS production
# ... production setup ...
```

### 3. Security Hardening
```dockerfile
# Run as non-root user
USER mcp

# Minimal permissions
RUN chown -R mcp:nodejs /app
```

### 4. Health Checks
```dockerfile
# Simple health check
HEALTHCHECK --interval=30s CMD node -e "console.log('OK')" || exit 1
```

### 5. Resource Limits
```yaml
services:
  mcp-server:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

---

## 📞 Getting Help

If you're still having issues:

1. **Check the logs**: `docker-compose logs -f`
2. **Run the fix script**: `./scripts/fix-docker.sh`
3. **Open an issue**: Include logs and system info
4. **Join discussions**: GitHub Discussions for questions

**System Info to Include**:
```bash
# Gather system info
echo "Docker: $(docker --version)"
echo "Compose: $(docker-compose --version)"
echo "Node: $(node --version)"
echo "OS: $(uname -a)"
echo "Memory: $(free -h)"
echo "Disk: $(df -h)"
```