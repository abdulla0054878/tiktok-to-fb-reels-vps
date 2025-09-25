#!/bin/bash
echo "🚀 Updating system..."

cd /root/tiktok-to-fb-reels-vps || exit
git pull origin main
npm install
pip install -r requirements.txt
pm2 restart all

echo "✅ Update complete at $(date)"
