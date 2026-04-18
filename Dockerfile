# Jarvis: Complete AI Agent Template
# Bundles OpenClaw + gbrain + workspace

# Stage 1: Build gbrain CLI
FROM oven/bun:latest AS gbrain-builder

WORKDIR /build/gbrain
COPY gbrain/ .

RUN bun install && \
    bun build --compile --outfile bin/gbrain src/cli.ts

# Stage 2: Runtime
FROM oven/bun:latest

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install OpenClaw
RUN curl -sSL https://install.openclaw.io | bash || \
    curl -sSL https://install.openclaw.ai | bash || \
    echo "Warning: OpenClaw install may need manual configuration"

# Copy gbrain binary from builder
COPY --from=gbrain-builder /build/gbrain/bin/gbrain /usr/local/bin/gbrain

# Copy workspace
COPY brain/ /app/brain/
COPY skills/ /app/skills/
COPY memory/ /app/memory/
COPY AGENTS.md SOUL.md IDENTITY.md HEARTBEAT.md TOOLS.md /app/

# Initialize gbrain database (PGLite)
RUN gbrain init || echo "GBrain init deferred to runtime"

# Expose OpenClaw web UI port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD gbrain doctor --json | grep -q '"healthy"' || exit 1

# Default: Run OpenClaw
CMD ["openclaw", "run"]
