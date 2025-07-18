# MCP TypeScript Server

[![CI/CD Pipeline](https://github.com/ajeetraina/mcp-typescript-server/actions/workflows/ci.yml/badge.svg)](https://github.com/ajeetraina/mcp-typescript-server/actions/workflows/ci.yml)
[![Docker Pulls](https://img.shields.io/docker/pulls/ajeetraina/mcp-typescript-server)](https://hub.docker.com/r/ajeetraina/mcp-typescript-server)
[![codecov](https://codecov.io/gh/ajeetraina/mcp-typescript-server/branch/main/graph/badge.svg)](https://codecov.io/gh/ajeetraina/mcp-typescript-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A production-ready Model Context Protocol (MCP) server built with TypeScript from scratch. This implementation provides a robust, scalable foundation for building AI-powered applications with tool integration, resource management, and comprehensive error handling.

## 🚀 Quick Start

### 🐳 Docker (Recommended - No Setup Required)

```bash
# Clone and start immediately
git clone https://github.com/ajeetraina/mcp-typescript-server.git
cd mcp-typescript-server

# Fix any Docker issues automatically
chmod +x scripts/fix-docker.sh
./scripts/fix-docker.sh

# Start the server
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

### 📦 Local Installation

```bash
# Clone the repository
git clone https://github.com/ajeetraina/mcp-typescript-server.git
cd mcp-typescript-server

# Automated setup
chmod +x scripts/setup.sh
./scripts/setup.sh

# Start the server
npm start
```

### ⚡ Quick Test

Once running, test the calculator tool:

```bash
# Test calculation (replace with your method of sending JSON-RPC)
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"calculate","arguments":{"expression":"(10+5)*2"}}}' | node dist/server.js
```

> **🛠️ Having Docker issues?** Check [DOCKER_TROUBLESHOOTING.md](DOCKER_TROUBLESHOOTING.md) or run `./scripts/fix-docker.sh`

## 🚀 Features

- **Type-Safe Architecture**: Built with TypeScript for better developer experience and code reliability
- **Production Ready**: Comprehensive error handling, logging, and monitoring
- **Containerized**: Docker support with multi-stage builds for optimal performance
- **Extensible Tool System**: Easy-to-extend modular tool architecture
- **Security First**: Input validation, path restrictions, and rate limiting
- **Comprehensive Testing**: Unit, integration, and load tests with >70% coverage
- **CI/CD Ready**: GitHub Actions workflows for automated testing and deployment
- **Performance Optimized**: Caching, memory management, and health monitoring

## 📋 Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Available Tools](#available-tools)
- [Docker Usage](#docker-usage)
- [Development](#development)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Docker (optional, for containerized deployment)

### From Source

```bash
# Clone repository
git clone https://github.com/ajeetraina/mcp-typescript-server.git
cd mcp-typescript-server

# Install dependencies
npm install

# Copy configuration template
cp config.json config.local.json

# Build the application
npm run build

# Run tests (optional)
npm test

# Start the server
npm start
```

### Using Docker (Recommended)

```bash
# Pull and run the latest image
docker run -p 3000:3000 ajeetraina/mcp-typescript-server:latest

# Or using Docker Compose
git clone https://github.com/ajeetraina/mcp-typescript-server.git
cd mcp-typescript-server
docker-compose up
```

## ⚙️ Configuration

The server can be configured through:

1. **Configuration file** (`config.json`)
2. **Environment variables**
3. **Command line arguments**

### Configuration File Example

```json
{
  "server": {
    "name": "typescript-mcp-server",
    "version": "1.0.0",
    "port": 3000
  },
  "logging": {
    "level": "info",
    "maxLogs": 1000
  },
  "security": {
    "allowedPaths": ["./data", "./temp"],
    "rateLimitRpm": 60
  },
  "tools": {
    "calculator": {
      "enabled": true,
      "maxExpressionLength": 100
    },
    "fileManager": {
      "enabled": true,
      "allowedExtensions": [".txt", ".json", ".md", ".csv"]
    }
  }
}
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production/test) | `production` |
| `MCP_SERVER_NAME` | Server name | `typescript-mcp-server` |
| `MCP_RATE_LIMIT` | Rate limit (requests per minute) | `60` |
| `MCP_API_KEY` | Optional API key for authentication | - |
| `DEBUG` | Enable debug logging | `false` |

## 🛠️ Available Tools

### Calculator Tool

Perform mathematical calculations with support for basic arithmetic operations.

```json
{
  "method": "tools/call",
  "params": {
    "name": "calculate",
    "arguments": {
      "expression": "(10 + 5) * 2 - 8"
    }
  }
}
```

### File Manager Tool

Secure file operations within allowed directories.

```json
{
  "method": "tools/call",
  "params": {
    "name": "read_file",
    "arguments": {
      "path": "./data/example.txt"
    }
  }
}
```

Supported operations:
- `read_file`: Read file contents
- `write_file`: Write content to file
- `list_directory`: List directory contents

### Available Resources

- `config://server.json`: Current server configuration
- `logs://recent.txt`: Recent server logs
- `health://status.json`: Server health status

## 🐳 Docker Usage

### Quick Start

```bash
# Fix any Docker issues first
./scripts/fix-docker.sh

# Start in production mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the server
docker-compose down
```

### Development Mode

```bash
# Start development environment with hot reload
docker-compose --profile dev up

# This includes:
# - Volume mounted source code
# - Automatic TypeScript compilation
# - Hot reload with nodemon
```

### Testing Mode

```bash
# Run tests in container
docker-compose --profile test up

# This runs the full test suite including:
# - Unit tests
# - Integration tests
# - Coverage reports
```

### Multi-Architecture Support

The Docker images support both `linux/amd64` and `linux/arm64` architectures.

```bash
# Pull specific architecture
docker pull --platform linux/arm64 ajeetraina/mcp-typescript-server:latest
```

## 👨‍💻 Development

### Setup Development Environment

```bash
# Install dependencies
npm install

# Create data directories
mkdir -p data temp logs

# Start development server with hot reload
npm run dev

# Or using Docker
docker-compose --profile dev up
```

### Code Style

The project uses ESLint and Prettier for code formatting:

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npx prettier --write "src/**/*.ts"
```

### Adding New Tools

1. Create a new tool class in `src/tools/`:

```typescript
import { ToolDefinition, ToolResult } from '../types/index.js';

export class MyCustomTool {
  getDefinition(): ToolDefinition {
    return {
      name: 'my_tool',
      description: 'Description of what the tool does',
      inputSchema: {
        type: 'object',
        properties: {
          param1: {
            type: 'string',
            description: 'Parameter description',
          },
        },
        required: ['param1'],
      },
    };
  }

  async execute(args: { param1: string }): Promise<ToolResult> {
    // Tool implementation
    return {
      content: [{
        type: 'text',
        text: `Result: ${args.param1}`,
      }],
    };
  }
}
```

2. Register the tool in `src/server.ts`:

```typescript
import { MyCustomTool } from './tools/myCustomTool.js';

// In initializeTools method
const myTool = new MyCustomTool();
this.tools.set('my_tool', myTool);
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- server.test.ts

# Run integration tests
npm test -- integration.test.ts

# Run load tests
npm test -- load.test.ts
```

### Test Types

- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test server startup and MCP protocol communication
- **Load Tests**: Test performance under concurrent requests
- **Security Tests**: Test input validation and security measures

### Coverage Requirements

- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## 📚 API Documentation

### MCP Protocol Methods

#### List Tools

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

#### Call Tool

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "calculate",
    "arguments": {
      "expression": "2 + 3 * 4"
    }
  }
}
```

#### List Resources

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "resources/list",
  "params": {}
}
```

#### Read Resource

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "resources/read",
  "params": {
    "uri": "config://server.json"
  }
}
```

### Health Check Endpoint

The server provides health monitoring through the `health://status.json` resource:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123456,
  "memory": {
    "used": 45678901,
    "total": 67890123
  },
  "tools": {
    "calculator": true,
    "fileManager": true
  }
}
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Docker Build Fails

**Issue**: Package lock file mismatch or build context issues.

**Solution**:
```bash
# Use the automated fix
./scripts/fix-docker.sh

# Or manual fix
git pull origin main
rm -rf node_modules package-lock.json
npm install
docker-compose build --no-cache
```

#### 2. TypeScript Compilation Errors

**Issue**: Type mismatches or missing dependencies.

**Solution**:
```bash
# Pull latest fixes
git pull origin main

# Clean and rebuild
npm run clean
npm install
npm run build
```

#### 3. Port Already in Use

**Issue**: Port 3000 is already occupied.

**Solution**:
```bash
# Find and kill process
lsof -i :3000
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

#### 4. Permission Errors

**Issue**: Cannot write to data directories.

**Solution**:
```bash
# Fix permissions
sudo chown -R $USER:$USER data temp logs

# Or recreate directories
rm -rf data temp logs
mkdir -p data temp logs
```

### Getting Help

- **Docker Issues**: Check [DOCKER_TROUBLESHOOTING.md](DOCKER_TROUBLESHOOTING.md)
- **Quick Start**: See [QUICKSTART.md](QUICKSTART.md)
- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and community support

## 🚀 Deployment

### Production Deployment

#### Using Docker

```bash
# Build production image
docker build -t mcp-typescript-server:latest .

# Run in production mode
docker run -d \
  --name mcp-server \
  --restart unless-stopped \
  -p 3000:3000 \
  -v /path/to/data:/app/data \
  -v /path/to/config.json:/app/config.json:ro \
  -e NODE_ENV=production \
  mcp-typescript-server:latest
```

#### Using Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Build the application
npm run build

# Start with PM2
pm2 start dist/server.js --name "mcp-server"

# Monitor
pm2 monit

# View logs
pm2 logs mcp-server
```

#### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-typescript-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mcp-typescript-server
  template:
    metadata:
      labels:
        app: mcp-typescript-server
    spec:
      containers:
      - name: mcp-server
        image: ajeetraina/mcp-typescript-server:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
```

### Monitoring and Observability

- **Health Checks**: Built-in health monitoring
- **Logging**: Structured logging with configurable levels
- **Metrics**: Memory usage and performance monitoring
- **Error Tracking**: Comprehensive error handling and reporting

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `npm test`
6. Lint your code: `npm run lint`
7. Commit your changes: `git commit -m 'Add amazing feature'`
8. Push to the branch: `git push origin feature/amazing-feature`
9. Open a Pull Request

### Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Documentation**: [GitHub Wiki](https://github.com/ajeetraina/mcp-typescript-server/wiki)
- **Issues**: [GitHub Issues](https://github.com/ajeetraina/mcp-typescript-server/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ajeetraina/mcp-typescript-server/discussions)
- **Docker Issues**: [DOCKER_TROUBLESHOOTING.md](DOCKER_TROUBLESHOOTING.md)

## 🙏 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) for the protocol specification
- [TypeScript](https://www.typescriptlang.org/) for the amazing type system
- All contributors who help improve this project

---

**Built with ❤️ by the community for AI developers everywhere.**