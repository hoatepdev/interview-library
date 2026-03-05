#!/bin/bash
# ─────────────────────────────────────────────────────────────
# VPS Initial Setup Script for Interview Library Backend
# Run once on a fresh Ubuntu 22.04 / 24.04 VPS
# Usage: bash scripts/vps-setup.sh
# ─────────────────────────────────────────────────────────────

set -e

echo "==> Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y

echo "==> Installing Docker..."
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "==> Adding current user to docker group..."
sudo usermod -aG docker "$USER"

echo "==> Creating app directory..."
mkdir -p ~/services/interview-library

echo "==> Creating .env file from example..."
if [ ! -f ~/services/interview-library/.env ]; then
  cat > ~/services/interview-library/.env << 'EOF'
PORT=9001
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app

DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=CHANGE_ME_STRONG_PASSWORD
DB_NAME=interview_library

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=https://api.your-domain.com/api/auth/google/callback

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=https://api.your-domain.com/api/auth/github/callback

SESSION_SECRET=CHANGE_ME_RUN_openssl_rand_-hex_32
EOF
  echo "==> .env created at ~/services/interview-library/.env — EDIT IT before starting!"
else
  echo "==> .env already exists, skipping."
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit ~/services/interview-library/.env with your actual values"
echo "  2. Log out and back in (for docker group to take effect)"
echo "  3. Configure GitHub Secrets (see DEPLOY.md)"
echo "  4. Push to main branch to trigger deployment"
