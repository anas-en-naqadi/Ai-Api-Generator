# 🚀 API Generator with AI

> Generate REST APIs automatically from natural language descriptions using AI (Groq)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
[![Fastify](https://img.shields.io/badge/Fastify-4.24-green.svg)](https://www.fastify.io/)

> ⚠️ **Note**: This is a **proof of concept (POC)** project demonstrating AI-powered API generation. It's not production-ready and should be used for learning and experimentation purposes.

**API Generator** is a fullstack application that automatically generates REST API endpoints from functional descriptions. Simply describe what you want your API to do, and the AI generates the TypeScript code, creates a secure endpoint, and provides complete documentation.

## ✨ Features

- 🤖 **AI-Powered Code Generation** - Uses Groq AI to generate TypeScript functions from natural language
- 🔒 **Secure Execution** - Sandboxed execution environment with code validation
- 🔑 **Token-Based Authentication** - Each API endpoint is protected with a unique token
- 📚 **Auto-Generated Documentation** - Complete API docs with code examples (curl, JavaScript, Python)
- 🎨 **Modern UI** - Beautiful React interface for creating, testing, and managing APIs
- 🧪 **Built-in API Tester** - Test your APIs directly from the interface
- ✏️ **Edit & Update** - Modify existing functions with automatic documentation regeneration
- 📊 **Smart Examples** - AI-generated example payloads for testing

## 🎯 How It Works

1. **Describe Your Function** - Enter the function name, parameters, business logic, and return type
2. **AI Generates Code** - Groq AI creates TypeScript code based on your description
3. **Secure Execution** - Code is validated and executed in a sandboxed environment
4. **Get Your API** - Receive a REST endpoint with token authentication and full documentation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Groq API key ([Get one here](https://console.groq.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/anas-en-naqadi/Ai-Api-Generator.git
cd Ai-Api-Generator

# Install all dependencies
npm run install:all
```

### Configuration

Create `backend/.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
PORT=3000
```

### Development

```bash
# Start both backend and frontend
npm run dev

# Or start separately:
npm run dev:backend   # Backend on http://localhost:3000
npm run dev:frontend  # Frontend on http://localhost:5173
```

### Production Build

```bash
# Build everything
npm run build

# Start production server
cd backend && npm start
```

## 📖 Usage

### Creating an API

1. Open `http://localhost:5173`
2. Go to the **Create** tab
3. Fill in:
   - Function name (e.g., `calculateTotalPrice`)
   - Input parameters (name, type, required/optional)
   - Business logic description
   - Output type
4. Click **Generate Function**
5. Your API is ready at `POST /api/calculateTotalPrice`

### Testing Your API

1. Go to the **Functions** tab
2. Click **▶️ Test** on any function
3. Fill in the test parameters
4. Click **Execute** to see the result

### Using Your API Externally

1. Go to **Functions** → Click **📚 Docs** on your function
2. Copy the API token
3. Use the provided examples (curl, JavaScript, Python) with your token:

```bash
curl -X POST http://localhost:3000/api/calculateTotalPrice \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"unitPrice": 25.50, "quantity": 4, "discountPercent": 10}'
```

## 🏗️ Architecture

```
Ai-Api-Generator/
├── backend/              # Fastify API server
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   │   ├── ai-generator.ts        # Groq AI integration
│   │   │   ├── sandbox-executor.ts    # Secure code execution
│   │   │   ├── documentation-generator.ts  # Auto-docs
│   │   │   └── ...
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Utilities
│   └── storage/          # Function storage (JSON)
├── frontend/             # React + Vite
│   ├── src/
│   │   ├── components/  # React components
│   │   └── hooks/        # Custom hooks
│   └── ...
└── package.json          # Workspace root
```

## 🛠️ Tech Stack

### Backend
- **Fastify** 4.24 - High-performance web framework
- **TypeScript** 5.3 - Type-safe development
- **Groq SDK** 0.3 - AI code generation
- **vm2** 3.9 - Secure sandbox execution
- **Zod** 3.22 - Runtime validation

### Frontend
- **React** 18.2 - UI library
- **Vite** 5.0 - Build tool
- **TypeScript** 5.2 - Type safety

## 🔒 Security

- **Sandboxed Execution** - Code runs in isolated VM2 environment
- **Code Validation** - Pre-execution security checks
- **Token Authentication** - Each API protected with unique token
- **Input Validation** - Zod schema validation for all inputs
- **Timeout Protection** - 5-second execution limit

See [SECURITY.md](./SECURITY.md) for detailed security information.

## 📝 Example Functions

### Simple: Calculate Total Price

```typescript
// Input: { unitPrice: number, quantity: number, discountPercent?: number }
// Output: number
// Logic: Calculate total price with optional discount
```

### Complex: Customer Segmentation

```typescript
// Input: { customers: array, minPremiumSpending?: number, ... }
// Output: object
// Logic: Analyze customers and segment by spending patterns
```

See [TEST_EXAMPLES.md](./TEST_EXAMPLES.md) for complete examples.

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- [Groq](https://groq.com/) for AI capabilities
- [Fastify](https://www.fastify.io/) for the amazing web framework
- [React](https://reactjs.org/) for the UI library
- [vm2](https://github.com/patriksimek/vm2) for secure code execution

## ⚠️ Project Status

This is a **proof of concept (POC)** project. While functional, it's intended for:
- Learning and experimentation
- Demonstrating AI-powered code generation
- Exploring the possibilities of natural language to API conversion

**Not recommended for production use** without significant security hardening, testing, and optimization.

## 🐛 Known Issues

- Complex nested object validation may need refinement
- AI-generated code may require manual adjustments for edge cases
- Sandbox security should be enhanced for production use
- Error handling could be more robust

## 📧 Support

- Open an [issue](https://github.com/anas-en-naqadi/Ai-Api-Generator/issues) for bug reports
- Check [SECURITY.md](./SECURITY.md) for security concerns

## 🗺️ Roadmap

- [ ] Support for multiple AI providers
- [ ] API versioning
- [ ] Rate limiting per function
- [ ] Webhook support
- [ ] GraphQL endpoint generation
- [ ] Database integration
- [ ] Multi-language code generation

---

Made with ❤️ by the API Generator team
