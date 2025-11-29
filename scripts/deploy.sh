#!/bin/bash
set -e

# Load NVM if installed (for non-login shells)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Also try common Node.js paths
export PATH="/usr/local/bin:/usr/bin:$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node 2>/dev/null | tail -1)/bin:$PATH"

DEPLOY_DIR="/opt/flagwise"
BACKEND_DIR="$DEPLOY_DIR/backend"
FRONTEND_DIR="$DEPLOY_DIR/frontend"

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

# Create systemd service for backend if it doesn't exist
if [ ! -f /etc/systemd/system/flagwise-backend.service ]; then
    echo "Creating systemd service for backend..."
    sudo tee /etc/systemd/system/flagwise-backend.service > /dev/null << EOF
[Unit]
Description=FlagWise Backend API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$BACKEND_DIR
ExecStart=/usr/bin/node $BACKEND_DIR/dist/main.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=$BACKEND_DIR/.env

[Install]
WantedBy=multi-user.target
EOF
    sudo systemctl daemon-reload
    sudo systemctl enable flagwise-backend
fi

# Restart backend service
echo "Restarting backend service..."
sudo systemctl restart flagwise-backend

# Configure nginx if not already done
if [ ! -f /etc/nginx/sites-available/flagwise ]; then
    echo "Configuring nginx..."
    sudo tee /etc/nginx/sites-available/flagwise > /dev/null << 'EOF'
server {
    listen 80;
    server_name flagwise.rant-ai.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name flagwise.rant-ai.com;

    # SSL configuration (managed by certbot or manual)
    ssl_certificate /etc/letsencrypt/live/flagwise.rant-ai.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/flagwise.rant-ai.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend static files
    root /opt/flagwise/frontend;
    index index.html;

    # API proxy to backend
    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    # Frontend routing (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml;
}
EOF
    sudo ln -sf /etc/nginx/sites-available/flagwise /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
else
    echo "Nginx already configured, reloading..."
    sudo nginx -t && sudo systemctl reload nginx
fi

# Set proper permissions
echo "Setting permissions..."
sudo chown -R www-data:www-data $DEPLOY_DIR

echo "=== Deployment completed successfully ==="
echo "Backend running on port 3000"
echo "Frontend served at https://flagwise.rant-ai.com/"
