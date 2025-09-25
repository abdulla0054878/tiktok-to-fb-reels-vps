#!/bin/bash
set -e

echo "🚀 Updating system..."
cd /root/tiktok-to-fb-reels-rgs

if [ -d "venv" ]; then
  source venv/bin/activate
fi

git pull origin main || true
npm install
pip install -r requirements.txt

if command -v pm2 >/dev/null 2>&1; then
  pm2 restart all || true
fi

echo "✅ Update complete at $(date)"
