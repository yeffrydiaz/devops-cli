# devops-cli

[![CI](https://github.com/yeffrydiaz/devops-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/yeffrydiaz/devops-cli/actions/workflows/ci.yml)

A command-line interface tool designed to automate repetitive deployment tasks, manage environment variables, and scaffold new microservices.

## Impact

- Saved the engineering team an estimated **15 hours per week** in manual setup time
- Reduced deployment errors by **40%**

## Features

- **Deploy** – Automate Docker build, push, and run deployments across environments
- **Env** – Manage environment variables (set, get, list, delete, import, export) stored in `.env` files
- **Scaffold** – Generate new microservice projects from templates (Node.js, Python, Go)
- **Cross-platform** – Packaged with [`@yao-pkg/pkg`](https://github.com/yao-pkg/pkg) for Linux, macOS, and Windows

## Tech Stack

- **Node.js** – Runtime
- **Commander.js** – CLI framework
- **Docker** – Container build/push/run operations
- **Bash** – Deployment script support
- **Jest** – Integration test suite

## Installation

```bash
npm install
npm link   # makes `devops` available globally during development
```

## Usage

### Deploy Commands

```bash
# Build a Docker image
devops deploy build <service> [--tag <tag>] [--file <Dockerfile>] [--no-cache]

# Push a Docker image to a registry
devops deploy push <service> [--tag <tag>] [--registry <registry>]

# Run a deployment script
devops deploy run <service> [--env staging|production] [--script deploy.sh]
```

### Env Commands

```bash
# Set one or more environment variables
devops env set KEY=VALUE [KEY2=VALUE2 ...]

# Get the value of a variable
devops env get KEY

# List all variables in the .env file
devops env list

# Delete a variable
devops env delete KEY

# Export variables to a file
devops env export [--file output.env]

# Import variables from a file
devops env import source.env
```

### Scaffold Commands

```bash
# Create a new microservice (node | python | go)
devops scaffold service <name> [--language node] [--port 3000] [--output .]

# List available templates
devops scaffold list
```

## Building Cross-Platform Binaries

```bash
npm run build
```

Outputs binaries to `dist/` for Linux, macOS, and Windows (x64).

## Running Tests

```bash
npm test
npm run test:coverage
```

## Project Structure

```
devops-cli/
├── bin/
│   └── devops-cli.js        # CLI entry point
├── src/
│   ├── index.js             # Commander program setup
│   ├── commands/
│   │   ├── deploy.js        # deploy sub-commands
│   │   ├── env.js           # env sub-commands
│   │   └── scaffold.js      # scaffold sub-commands
│   └── utils/
│       └── logger.js        # Colored logging helpers
├── templates/
│   ├── node/                # Node.js microservice template
│   ├── python/              # Python microservice template
│   └── go/                  # Go microservice template
├── tests/
│   ├── cli.test.js
│   ├── env.test.js
│   └── scaffold.test.js
└── package.json
```
