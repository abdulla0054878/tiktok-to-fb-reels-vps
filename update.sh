#!/bin/bash
set -e

echo "🚀 Updating system..."
cd /root/tiktok-to-fb-reels-rgs

# Activate venv if exists
if [ -d "venv" ]; then
  source venv/bin/activate
fi

# Pull latest code
git pull origin main || true

# Install deps
npm install
pip install -r requirements.txt

# Restart PM2 apps if using PM2
if command -v pm2 >/dev/null 2>&1; then
  pm2 restart all || true
fi

echo "✅ Update complete at $(date)"
