# Quick Start Guide

## 🔧 TypeScript Compilation Fixes

If you encounter TypeScript compilation errors after cloning, we've fixed the issues. Here's how to get started:

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/ajeetraina/mcp-typescript-server.git
cd mcp-typescript-server

# Run the setup script
chmod +x scripts/setup.sh
./scripts/setup.sh

# Start the server
npm start
```

### Option 2: Manual Setup

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

### Option 3: Docker (No TypeScript compilation needed)

```bash
# Clone the repository
git clone https://github.com/ajeetraina/mcp-typescript-server.git
cd mcp-typescript-server

# Start with Docker Compose
docker-compose up --build
```

## ✅ Verification

After setup, verify everything works:

```bash
# Check if files are built
ls dist/
# Should show: server.js and other compiled files

# Run tests
npm test

# Check server health (in another terminal after starting)
curl -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' \
  http://localhost:3000 2>/dev/null || echo "Server running via stdio"
```

## 🛠️ Development Mode

```bash
# Start with hot reload
npm run dev

# Or with Docker for development
docker-compose --profile dev up
```

## 📝 Testing the MCP Server

Once running, test the calculator tool:

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

Expected response:
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

## 🐞 Common Issues

### Issue: TypeScript compilation errors
**Solution**: The latest commit includes fixes. Pull the latest changes:
```bash
git pull origin main
npm install
npm run build
```

### Issue: "Module not found" errors
**Solution**: Ensure you're using Node.js 18+ and clear cache:
```bash
node --version  # Should be 18+
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Issue: Permission errors on scripts
**Solution**: Make scripts executable:
```bash
chmod +x scripts/*.sh
```

### Issue: Port already in use
**Solution**: Change the port or kill existing processes:
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process (replace PID)
kill -9 <PID>

# Or use a different port
PORT=3001 npm start
```

## 🚀 Next Steps

1. **Explore the API**: Check `README.md` for complete API documentation
2. **Add Tools**: Follow the guide in `README.md` to add custom tools
3. **Configure**: Edit `config.json` for your specific needs
4. **Deploy**: Use the deployment scripts in `scripts/deploy.sh`
5. **Monitor**: Check logs in the `logs/` directory

## 📚 Additional Resources

- **Full Documentation**: [README.md](README.md)
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **GitHub Issues**: For support and bug reports
- **Docker Hub**: Pre-built images available

---

**Need help?** Open an issue on GitHub or check the troubleshooting section in the README.