FROM oven/bun:1 AS base

WORKDIR /app

# Copy package files first
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile || bun install

# Copy the rest
COPY . .

# Make scripts executable
RUN chmod +x cli/*.ts reflex-*/scripts/*.ts

# Default command
ENTRYPOINT ["bun", "cli/index.ts"]
CMD ["introspect", "--project", "/project"]
