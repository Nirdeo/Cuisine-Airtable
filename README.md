This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Cuisine Airtable

This is a Next.js project with Ollama integration for AI chat capabilities.

## Getting Started with Ollama Integration

### Prerequisites

You can run this application in two ways:

#### Option 1: Local Installation

1. Make sure you have [Ollama](https://ollama.com/) installed and running locally on your machine.
2. By default, Ollama runs on `http://localhost:11434`. If your Ollama instance is running on a different host, you can set the `OLLAMA_HOST` environment variable.

#### Option 2: Docker (Recommended)

1. Make sure you have [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed on your machine.

### How to Use

#### Using Docker (Recommended)

##### Development Mode

For development with hot reloading:

1. Clone this repository
2. Run the application in development mode using one of these methods:

   **Using npm script (recommended):**
   ```bash
   npm run docker:dev
   ```

   **Or using Docker Compose directly:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser
4. Make changes to your code and see them reflected immediately
5. Use the chat interface to interact with your Ollama models

To stop the development environment:

   **Using npm script:**
   ```bash
   npm run docker:dev:down
   ```

   **Or using Docker Compose directly:**
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```


#### Using Local Installation

1. Start your Ollama server locally
2. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser
4. Use the chat interface to interact with your Ollama models

### Ollama Integration Details

This project integrates Ollama using the official `ollama` JavaScript client. The integration consists of:

1. **Utility Functions** (`src/utils/ollama.ts`):
   - `generateResponse`: Generate a response from a model
   - `listModels`: List all available models
   - `streamResponse`: Stream a response with progress updates

2. **API Routes** (`src/app/api/ollama/route.ts`):
   - `GET /api/ollama`: List all available models
   - `POST /api/ollama`: Generate a response from a model

3. **Chat Component** (`src/components/OllamaChat.tsx`):
   - A React component that provides a chat interface
   - Allows selecting different models
   - Displays conversation history

### Environment Variables

You can customize the Ollama integration by setting the following environment variables:

```
OLLAMA_HOST=http://your-ollama-host:11434
```

## Development

This project uses Next.js with TypeScript and Tailwind CSS.

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

## Docker Setup

This project includes Docker configuration for easy deployment with Ollama integration.

### Docker Files

- `Dockerfile.dev`: Configures the Next.js application container for development with hot reloading
- `docker-compose.dev.yml`: Orchestrates the Next.js application and Ollama service for development

### Docker Development Setup

The Docker setup is configured for development with hot reloading:

- Uses `Dockerfile.dev` which runs the Next.js development server with hot reloading
- Mounts the local directory to the container for immediate code changes
- Sets `NODE_ENV=development`
- Preserves the container's node_modules directory
- Ideal for active development and testing

### Managing Ollama Models in Docker

When running with Docker, Ollama models are stored in a Docker volume. To manage models:

1. Access the Ollama container:
   ```bash
   docker exec -it cuisine-airtable-ollama-1 /bin/bash
   ```

2. Pull models using the Ollama CLI:
   ```bash
   ollama pull llama3.2
   ollama pull mistral
   ```

3. List available models:
   ```bash
   ollama list
   ```

### Customizing the Docker Setup

You can customize the Docker setup by modifying the `docker-compose.dev.yml` file:

- Change the exposed ports
- Add environment variables
- Configure resource limits
- Add additional services

After making changes, restart the containers:
```bash
npm run docker:dev:down
npm run docker:dev
```

Or using Docker Compose directly:
```bash
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```
