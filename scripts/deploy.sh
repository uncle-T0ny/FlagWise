#!/bin/bash
set -e

# Load NVM if installed (for non-login shells)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Also try common Node.js paths
export PATH="/usr/local/bin:/usr/bin:$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node 2>/dev/null | tail -1)/bin:$PATH"

DEPLOY_DIR="/opt/flagwise"
BACKEND_DIR="$DEPLOY_DIR/backend"

echo "=== FlagWise Deployment Script ==="
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Install backend dependencies
echo "Installing backend dependencies..."
cd $BACKEND_DIR
npm ci --omit=dev

# Create .env file for backend
echo "Configuring backend environment..."
cat > $BACKEND_DIR/.env << EOF
CEREBRAS_API_KEY=$CEREBRAS_API_KEY
NODE_ENV=production
PORT=3000
EOF

# Restart backend service (requires sudoers entry for deploy user)
echo "Restarting backend service..."
sudo systemctl restart flagwise-backend

# Check service status
echo "Checking service status..."
sudo systemctl status flagwise-backend --no-pager || true

echo "=== Deployment completed successfully ==="
echo "Backend running on port 3000"
echo "Frontend served at https://flagwise.rant-ai.com/"
