# Jarvis: OpenClaw Workspace with gbrain Integration
# Complete AI agent runtime with vector search and skills

FROM oven/bun:latest

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    ca-certificates \
    nodejs \
    npm \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install OpenClaw
RUN curl -sSL https://get.openclaw.io | bash || \
    npm install -g @openclaw/cli || \
    echo "OpenClaw install - will configure at runtime"

# Copy workspace (brain, skills, memory, identity)
COPY brain/ /app/brain/
COPY skills/ /app/skills/
COPY memory/ /app/memory/
COPY AGENTS.md SOUL.md IDENTITY.md HEARTBEAT.md TOOLS.md .env.example /app/

# Copy gbrain source
COPY gbrain/ /app/gbrain/

# Build gbrain
WORKDIR /app/gbrain
RUN bun install
RUN bun build --compile --outfile /usr/local/bin/gbrain src/cli.ts || \
    echo "GBrain compile deferred to runtime"

WORKDIR /app

# Create directories for runtime persistence
RUN mkdir -p /app/.gbrain /app/.openclaw /app/logs

# Expose OpenClaw web UI port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000 > /dev/null 2>&1 || exit 1

# Startup script - Initialize gbrain, register MCP, start OpenClaw
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]
