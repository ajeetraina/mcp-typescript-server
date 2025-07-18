# Quick Start Guide

## 🔧 Docker Issues Fixed!

We've resolved the Docker build issues you encountered. The package-lock.json mismatch and container build problems have been fixed.

## 🚀 Three Ways to Get Started

### Option 1: Docker (Recommended - Zero Configuration)

```bash
# 1. Clone the repository
git clone https://github.com/ajeetraina/mcp-typescript-server.git
cd mcp-typescript-server

# 2. Fix any Docker issues automatically
chmod +x scripts/fix-docker.sh
./scripts/fix-docker.sh

# 3. Start the server
docker-compose up -d

# 4. Check status
docker-compose ps
docker-compose logs -f
```

### Option 2: Automated Local Setup

```bash
# 1. Clone and navigate
git clone https://github.com/ajeetraina/mcp-typescript-server.git
cd mcp-typescript-server

# 2. Run automated setup
chmod +x scripts/setup.sh
./scripts/setup.sh

# 3. Start the server
npm start
```

### Option 3: Manual Setup

```bash
# 1. Clone and navigate
git clone https://github.com/ajeetraina/mcp-typescript-server.git
cd mcp-typescript-server

# 2. Install dependencies
npm install

# 3. Create required directories
mkdir -p data temp logs

# 4. Build the project
npm run build

# 5. Start the server
npm start
```

## ✅ Verification

After setup, verify everything works:

```bash
# 1. Check if files are built (for local setup)
ls dist/
# Should show: server.js and other compiled files

# 2. Check Docker containers (for Docker setup)
docker-compose ps
# Should show containers running

# 3. View logs
# For Docker:
docker-compose logs -f
# For local:
npm start  # Will show logs in terminal

# 4. Test basic functionality
# The server accepts JSON-RPC over stdio
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node dist/server.js
```

## 📝 Testing the MCP Server

Once running, test the calculator tool:

### JSON-RPC Request Example:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "calculate",
    "arguments": {
      "expression": "(10 + 5) * 2"
    }
  }
}
```

### Expected Response:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Result: (10 + 5) * 2 = 30"
      }
    ]
  }
}
```

### Testing Commands:

```bash
# Test calculator
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"calculate","arguments":{"expression":"2+3*4"}}}' | node dist/server.js

# List available tools
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | node dist/server.js

# Check health status
echo '{"jsonrpc":"2.0","id":3,"method":"resources/read","params":{"uri":"health://status.json"}}' | node dist/server.js
```

## 🐞 Common Issues and Solutions

### Issue 1: Docker Build Fails with Package Lock Mismatch

**Error**: 
```
npm error Invalid: lock file's @modelcontextprotocol/sdk@1.16.0 does not satisfy @modelcontextprotocol/sdk@1.0.0
```

**Solution**: 
```bash
# This is now fixed! But if you still see it:
git pull origin main
./scripts/fix-docker.sh
```

### Issue 2: TypeScript Compilation Errors

**Error**: Type mismatches or build failures.

**Solution**: 
```bash
# Pull the latest fixes
git pull origin main

# Clean and rebuild
npm run clean
npm install
npm run build
```

### Issue 3: Permission Errors

**Error**: Cannot create directories or write files.

**Solution**: 
```bash
# Fix permissions
chmod +x scripts/*.sh
sudo chown -R $USER:$USER .

# Or recreate directories
rm -rf data temp logs
mkdir -p data temp logs
```

### Issue 4: Port Already in Use

**Error**: `EADDRINUSE` or port binding errors.

**Solution**: 
```bash
# Find what's using the port
lsof -i :3000

# Kill the process (replace PID)
kill -9 <PID>

# Or use a different port
PORT=3001 npm start
# or for Docker:
PORT=3001 docker-compose up
```

### Issue 5: "Module not found" Errors

**Error**: Cannot find modules during runtime.

**Solution**: 
```bash
# Ensure Node.js 18+
node --version  # Should be 18+

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

## 🔧 Development Mode

### Local Development with Hot Reload

```bash
# Start with automatic TypeScript compilation
npm run dev

# The server will restart automatically when you change files
```

### Docker Development Mode

```bash
# Start development container with volume mounting
docker-compose --profile dev up

# This provides:
# - Source code volume mounting
# - Automatic TypeScript compilation
# - Hot reload with nodemon
# - Development dependencies
```

### Testing Mode

```bash
# Run tests locally
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in Docker
docker-compose --profile test up
```

## 📋 Next Steps

### 1. Explore the API
- Check out the complete API documentation in [README.md](README.md)
- Test different tools and resources
- Try the file manager tool with safe file operations

### 2. Customize Configuration
```bash
# Edit the configuration file
cp config.json config.local.json
# Edit config.local.json with your settings
```

### 3. Add Your Own Tools
- Follow the tool development guide in [README.md](README.md)
- Check existing tools in `src/tools/` for examples
- Tools are automatically registered and exposed via MCP

### 4. Deploy to Production
```bash
# Use the deployment script
./scripts/deploy.sh

# Or manually with Docker
docker-compose -f docker-compose.yml up -d
```

### 5. Monitor and Debug
```bash
# View logs
docker-compose logs -f
# or for local:
tail -f logs/*.log

# Check health
curl http://localhost:3000/health  # If health endpoint is added
# or via resource:
echo '{"jsonrpc":"2.0","id":1,"method":"resources/read","params":{"uri":"health://status.json"}}' | node dist/server.js
```

## 📚 Additional Resources

- **Full Documentation**: [README.md](README.md)
- **Docker Troubleshooting**: [DOCKER_TROUBLESHOOTING.md](DOCKER_TROUBLESHOOTING.md)
- **Contributing Guide**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **GitHub Issues**: For support and bug reports
- **GitHub Discussions**: For questions and community help

## 🐟 Emergency Commands

### Nuclear Reset (if everything fails)
```bash
# Complete reset - use only if needed
git clean -fdx
git pull origin main
docker system prune -af
./scripts/fix-docker.sh
docker-compose up --build
```

### Quick Health Check
```bash
# Check if everything is working
./scripts/test-docker.sh --startup-only
```

### Get Help
```bash
# Show system information for debugging
echo "Docker: $(docker --version)"
echo "Node: $(node --version)"
echo "npm: $(npm --version)"
echo "OS: $(uname -a)"
```

---

**Need help?** 🙋‍♂️

1. Check [DOCKER_TROUBLESHOOTING.md](DOCKER_TROUBLESHOOTING.md) for detailed solutions
2. Run `./scripts/fix-docker.sh` to auto-fix common Docker issues
3. Open an issue on GitHub with your system info and error logs
4. Join GitHub Discussions for community support

**Happy coding!** 🚀