# Jarvis: OpenClaw Workspace with gbrain Integration
# Complete AI agent runtime with vector search and skills

FROM node:22-bookworm AS openclaw-builder

WORKDIR /build

# Install build dependencies
RUN apt-get update && apt-get install -y \
    git curl python3 make g++ ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash

# Clone OpenClaw at latest version
RUN git clone https://github.com/anthropics/openclaw.git . && \
    git log --oneline -1

# Build OpenClaw
RUN /root/.bun/bin/bun install && \
    /root/.bun/bin/bun run build

# Runtime stage
FROM node:22-bookworm

WORKDIR /app

# Install minimal runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates tini python3 curl git && \
    rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm

# Set OpenClaw state directory (persistent via Railway volumes)
ENV OPENCLAW_STATE_DIR=/data/openclaw \
    OPENCLAW_TOOLS_DIR=/data/tools \
    NODE_ENV=production

# Copy workspace (brain, skills, memory, identity)
COPY brain/ /app/brain/
COPY skills/ /app/skills/
COPY memory/ /app/memory/
COPY AGENTS.md SOUL.md IDENTITY.md HEARTBEAT.md TOOLS.md /app/

# Copy gbrain source
COPY gbrain/ /app/gbrain/
RUN cd /app/gbrain && npm install

# Copy OpenClaw from builder
COPY --from=openclaw-builder /build /app/openclaw

# Create persistent directories
RUN mkdir -p /data/openclaw /data/tools /app/.gbrain /app/logs

# Copy startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Use tini as PID 1 for proper signal handling
ENTRYPOINT ["/usr/bin/tini", "--"]

# Railway injects PORT at runtime - don't hardcode it
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080} > /dev/null 2>&1 || exit 1

CMD ["/app/start.sh"]
