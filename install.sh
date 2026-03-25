#!/bin/bash
# Reflex Installer
# Installs Reflex skills to your Zo Computer or any Bun environment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${GREEN}"
cat << 'LOGO'
    ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
    ┃   ██████╗ ███████╗██╗   ██╗  ┃
    ┃   ██╔══██╗██╔════╝██║   ██║  ┃
    ┃   ██████╔╝█████╗  ██║   ██║  ┃
    ┃   ██╔══██╗██╔══╝  ██║   ██║  ┃
    ┃   ██║  ██║███████╗╚██████╔╝  ┃
    ┃   ╚═╝  ╚═╝╚══════╝ ╚═════╝   ┃
    ┃                              ┃
    ┃   🐆 Your code's reflex       ┃
    ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
LOGO
echo -e "${NC}"
echo ""

# Detect environment
if [ -n "$ZO_CLIENT_IDENTITY_TOKEN" ]; then
  echo -e "${GREEN}Running inside Zo Computer${NC}"
  SKILLS_DIR="${REFLEX_SKILLS_DIR:-$HOME/Skills}"
else
  echo "Installing to standalone Bun environment"
  SKILLS_DIR="${REFLEX_SKILLS_DIR:-$(pwd)/Skills}"
fi

# Create directories
mkdir -p "$SKILLS_DIR"

# Copy skills
echo ""
echo "Installing Reflex skills..."

SKILLS=(
  "reflex-introspect"
  "reflex-prescribe"
  "reflex-evolve"
  "reflex-interview"
  "reflex-eval"
  "reflex-unstuck"
  "reflex-loop"
  "reflex-security"
  "reflex-planner"
  "reflex-simulate"
  "reflex-memory"
  "reflex-context"
  "reflex-wizard"
)

for skill in "${SKILLS[@]}"; do
  if [ -d "$skill" ]; then
    cp -r "$skill" "$SKILLS_DIR/"
    echo "  ✅ $skill"
  fi
done

# Copy CLI and config
cp -r cli "$SKILLS_DIR/" 2>/dev/null || true
cp reflex.config.ts "$SKILLS_DIR/" 2>/dev/null || true
cp package.json "$SKILLS_DIR/" 2>/dev/null || true
cp reflex-logo.svg "$SKILLS_DIR/" 2>/dev/null || true

echo ""
echo -e "${GREEN}Installation complete!${NC}"
echo ""
echo "Quick start:"
echo "  cd $SKILLS_DIR"
echo "  bun cli/index.ts --help"
echo "  bun cli/index.ts check --project /path/to/app"
echo ""
echo "LLM configuration:"
echo "  export REFLEX_LLM_PROVIDER=openai    # or anthropic, ollama, zo"
echo "  export REFLEX_LLM_API_KEY=sk-..."
echo ""
echo "GitHub URL support:"
echo "  bun cli/index.ts check https://github.com/user/repo"
echo ""
