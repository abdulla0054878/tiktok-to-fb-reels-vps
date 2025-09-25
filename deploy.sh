#!/bin/bash
set -e

cd ~/tiktok-to-fb-reels-vps

echo "[INFO] Resetting repo..."
git reset --hard
git pull origin main

echo "[INFO] Installing Python deps..."
pip3 install -r requirements.txt

echo "[INFO] Installing Node.js deps..."
npm install

echo "[INFO] Restarting with PM2..."
pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js

echo "[✅ SUCCESS] Deploy finished!"
