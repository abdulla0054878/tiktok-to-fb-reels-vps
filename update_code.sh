#!/bin/bash
set -e

cd ~/tiktok-to-fb-reels-vps

echo "[INFO] Fetching latest code from GitHub..."
git fetch --all
git reset --hard origin/main

echo "[INFO] Installing Python dependencies..."
pip3 install -r requirements.txt

echo "[INFO] Installing Node.js dependencies..."
npm install

echo "[INFO] Restarting PM2 process..."
pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js

echo "[✅ SUCCESS] Project fully updated & restarted!"
