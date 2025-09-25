#!/bin/bash
set -e
source .env

VIDEO_FILE="./downloads/latest.mp4"

echo "[START] TikTok → Facebook Bot Running..."

python3 tiktok_worker.py

if [ -f "$VIDEO_FILE" ]; then
  node fb_reels_uploader_final.js
  rm -f "$VIDEO_FILE"
  echo "[INFO] Video removed after upload."
else
  echo "[INFO] No new video found to upload."
fi

echo "[END] Done ✅"
