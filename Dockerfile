# Jarvis: Complete AI Agent Template for Railway
# Bundles gbrain + workspace with OpenClaw integration

FROM oven/bun:latest

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    ca-certificates \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Copy workspace first (brain, skills, memory)
COPY brain/ /app/brain/
COPY skills/ /app/skills/
COPY memory/ /app/memory/
COPY AGENTS.md SOUL.md IDENTITY.md HEARTBEAT.md TOOLS.md .env.example /app/

# Copy gbrain source (we'll run it with Bun, not compiled binary)
COPY gbrain/ /app/gbrain/

# Install gbrain dependencies
WORKDIR /app/gbrain
RUN bun install

# Back to app directory
WORKDIR /app

# Create directories for runtime
RUN mkdir -p /app/.gbrain /app/.openclaw /app/logs

# Expose port for web UI / OpenClaw
EXPOSE 3000

# Health check - test gbrain availability
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD bun run gbrain/src/cli.ts doctor --json > /dev/null 2>&1 || exit 1

# Startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]
