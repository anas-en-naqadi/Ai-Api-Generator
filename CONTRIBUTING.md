# Contributing to API Generator

Thank you for your interest in contributing to API Generator! This document provides guidelines and instructions for contributing.

## 🤝 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Celebrate diversity

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/yourusername/backend-api-generator-with-ia.git
   cd backend-api-generator-with-ia
   ```
3. **Install dependencies**
   ```bash
   npm run install:all
   ```
4. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📝 Development Workflow

### Running Tests

```bash
# Backend type checking
cd backend && npm run type-check

# Frontend linting
cd frontend && npm run lint
```

### Code Style

- Use TypeScript for all new code
- Follow existing code style and patterns
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and small

### Commit Messages

Use clear, descriptive commit messages:

```
feat: Add support for array input types
fix: Resolve token validation issue
docs: Update README with new examples
refactor: Simplify sandbox executor
test: Add tests for documentation generator
```

## 🐛 Reporting Bugs

1. Check if the issue already exists
2. Create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)
   - Error messages or logs

## ✨ Suggesting Features

1. Check existing issues and roadmap
2. Open an issue with:
   - Clear description of the feature
   - Use case and motivation
   - Proposed implementation (if any)

## 🔧 Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Ensure all checks pass**
4. **Update CHANGELOG.md** (if applicable)
5. **Request review** from maintainers

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings or errors
- [ ] Tests added/updated (if applicable)

## 🏗️ Project Structure

### Backend

- `src/routes/` - API route handlers
- `src/services/` - Business logic
- `src/types/` - TypeScript type definitions
- `src/utils/` - Utility functions

### Frontend

- `src/components/` - React components
- `src/hooks/` - Custom React hooks

## 🔍 Code Review Guidelines

- Be constructive and respectful
- Focus on code, not the person
- Ask questions if something is unclear
- Suggest improvements, don't just point out problems

## 📚 Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Fastify Documentation](https://www.fastify.io/docs/latest/)

## ❓ Questions?

Feel free to open an issue with the `question` label or reach out to maintainers.

Thank you for contributing! 🎉

