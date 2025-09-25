#!/bin/bash
set -e

cd ~/tiktok-to-fb-reels-vps

echo "[INFO] Pulling latest code..."
git reset --hard
git pull origin main

echo "[INFO] Python deps..."
pip3 install -r requirements.txt

echo "[INFO] Node deps..."
npm install

echo "[INFO] Restarting pm2..."
pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js

echo "[SUCCESS] 🚀 Deploy Finished!"
