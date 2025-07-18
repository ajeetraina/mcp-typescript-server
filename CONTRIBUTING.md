# Contributing to MCP TypeScript Server

Thank you for your interest in contributing to the MCP TypeScript Server! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

This project adheres to a code of conduct that promotes a welcoming and inclusive environment. By participating, you agree to uphold this code.

### Our Standards

- Be respectful and inclusive
- Exercise empathy and kindness
- Focus on constructive feedback
- Accept responsibility for mistakes
- Prioritize community benefit

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git
- Docker (optional, for containerized development)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/mcp-typescript-server.git
   cd mcp-typescript-server
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/ajeetraina/mcp-typescript-server.git
   ```

## Development Setup

### Local Development

```bash
# Install dependencies
npm install

# Create data directories
mkdir -p data temp logs

# Copy configuration template
cp config.json config.local.json

# Start development server
npm run dev
```

### Docker Development

```bash
# Start development environment
docker-compose --profile dev up

# Or build and run manually
docker build -f Dockerfile.dev -t mcp-server-dev .
docker run -p 3000:3000 -v $(pwd):/app mcp-server-dev
```

### Keeping Your Fork Updated

```bash
# Fetch upstream changes
git fetch upstream

# Merge upstream changes to main
git checkout main
git merge upstream/main

# Push updates to your fork
git push origin main
```

## Contributing Guidelines

### Types of Contributions

We welcome various types of contributions:

- **Bug fixes**: Fix issues and improve stability
- **Features**: Add new tools, resources, or capabilities
- **Documentation**: Improve guides, API docs, or examples
- **Testing**: Add test cases or improve test coverage
- **Performance**: Optimize performance or reduce resource usage
- **Security**: Enhance security measures or fix vulnerabilities

### Before You Start

1. **Check existing issues**: Look for related issues or feature requests
2. **Create an issue**: If none exists, create one to discuss your proposal
3. **Get feedback**: Wait for maintainer feedback before significant work
4. **Assign yourself**: Assign the issue to yourself when ready to work

### Branch Naming

Use descriptive branch names:

- `feature/add-weather-tool`
- `fix/calculator-division-by-zero`
- `docs/improve-api-documentation`
- `test/add-integration-tests`
- `refactor/optimize-tool-loading`

## Pull Request Process

### Before Submitting

1. **Update your branch**:
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-feature-branch
   git rebase main
   ```

2. **Run tests**:
   ```bash
   npm test
   npm run lint
   npm run build
   ```

3. **Update documentation** if needed

### PR Requirements

- **Clear title**: Summarize the change in 50 characters or less
- **Detailed description**: Explain what, why, and how
- **Issue reference**: Link to related issues
- **Test coverage**: Include tests for new functionality
- **Documentation**: Update relevant documentation
- **Changelog**: Add entry to CHANGELOG.md if applicable

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Related Issues
Fixes #123

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No breaking changes (or noted)
```

### Review Process

1. **Automated checks**: CI/CD pipeline runs automatically
2. **Code review**: Maintainers review your code
3. **Feedback**: Address any requested changes
4. **Approval**: PR approved by maintainer
5. **Merge**: PR merged into main branch

## Coding Standards

### TypeScript Guidelines

- Use strict TypeScript configuration
- Prefer interfaces over type aliases for object shapes
- Use explicit return types for public methods
- Avoid `any` type; use proper typing
- Use meaningful variable and function names

### Code Style

- Follow ESLint configuration
- Use Prettier for formatting
- Maximum line length: 120 characters
- Use single quotes for strings
- Include trailing commas in multiline structures

### Architecture Principles

- **Single Responsibility**: Each class/function has one purpose
- **Dependency Injection**: Use constructor injection
- **Error Handling**: Proper error handling and logging
- **Security**: Validate inputs and sanitize outputs
- **Performance**: Consider performance implications

### Example Code Structure

```typescript
// Good: Clear interface definition
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JSONSchema;
}

// Good: Proper error handling
export class CalculatorTool {
  async calculate(expression: string): Promise<ToolResult> {
    try {
      const result = this.evaluateExpression(expression);
      return this.createSuccessResult(result);
    } catch (error) {
      return this.createErrorResult(error);
    }
  }

  private evaluateExpression(expression: string): number {
    // Implementation details
  }

  private createSuccessResult(result: number): ToolResult {
    // Create success response
  }

  private createErrorResult(error: Error): ToolResult {
    // Create error response
  }
}
```

## Testing

### Test Requirements

- **Unit tests**: Test individual components
- **Integration tests**: Test component interactions
- **Coverage**: Maintain >70% code coverage
- **Performance tests**: For performance-critical code

### Testing Best Practices

```typescript
// Good: Descriptive test names
describe('CalculatorTool', () => {
  describe('calculate', () => {
    it('should return correct result for addition', async () => {
      const calculator = new CalculatorTool();
      const result = await calculator.calculate('2 + 3');
      
      expect(result.isError).toBe(false);
      expect(result.content[0].text).toContain('= 5');
    });

    it('should handle division by zero gracefully', async () => {
      const calculator = new CalculatorTool();
      const result = await calculator.calculate('5 / 0');
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error');
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- calculator.test.ts

# Run in watch mode
npm run test:watch
```

## Documentation

### Documentation Types

- **README**: Project overview and quick start
- **API Documentation**: Tool and resource reference
- **Code Comments**: Inline documentation
- **Examples**: Usage examples and tutorials

### Documentation Standards

- Use clear, concise language
- Include code examples
- Keep documentation up to date
- Use proper markdown formatting
- Include table of contents for long documents

### JSDoc Comments

```typescript
/**
 * Calculates the result of a mathematical expression
 * @param expression - The mathematical expression to evaluate
 * @returns Promise resolving to calculation result
 * @throws {Error} When expression is invalid
 * @example
 * ```typescript
 * const result = await calculator.calculate('2 + 3');
 * console.log(result); // { content: [{ text: 'Result: 2 + 3 = 5' }] }
 * ```
 */
async calculate(expression: string): Promise<ToolResult> {
  // Implementation
}
```

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and general discussion
- **Pull Requests**: Code review and collaboration

### Getting Help

- Check existing documentation
- Search existing issues
- Ask questions in GitHub Discussions
- Reach out to maintainers if needed

### Recognition

We appreciate all contributions! Contributors will be:

- Listed in the project's contributor list
- Mentioned in release notes for significant contributions
- Invited to join the maintainer team for outstanding contributions

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Schedule

- **Patch releases**: As needed for critical bug fixes
- **Minor releases**: Monthly or when significant features are ready
- **Major releases**: When breaking changes are necessary

## Security

### Reporting Security Issues

Please report security vulnerabilities privately:

1. **Do not** create public GitHub issues for security vulnerabilities
2. Email security concerns to the maintainers
3. Include detailed information about the vulnerability
4. Allow time for the issue to be addressed before public disclosure

### Security Best Practices

- Validate all inputs
- Use secure coding practices
- Keep dependencies updated
- Follow principle of least privilege
- Implement proper authentication and authorization

## License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for contributing to the MCP TypeScript Server! Your efforts help make this project better for everyone.