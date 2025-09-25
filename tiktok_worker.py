import os
import time
import requests
from datetime import datetime
from dotenv import load_dotenv
import subprocess

load_dotenv()

PROFILE_URL = os.getenv("TIKTOK_PROFILE")
INTERVAL_SEC = int(os.getenv("CRON_INTERVAL_MINUTES", "5")) * 60
VIDEO_DIR = "/root/videos"

def require_env(name: str) -> str:
    val = os.getenv(name)
    if not val:
        raise RuntimeError(f"✘ Please set {name} environment variable")
    return val

def get_latest_video(profile_url: str):
    # TODO: Replace with real scraping/downloader logic.
    # Placeholder response structure:
    # return ("https://example.com/video.mp4", "Example TikTok caption") when new video exists
    return (None, None)

def download_video(url: str, out_path: str):
    with requests.get(url, stream=True, timeout=60) as r:
        r.raise_for_status()
        with open(out_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)

def upload_to_facebook(video_path: str, caption: str):
    cmd = ['node', 'fb_reels_uploader_final.js', video_path, caption]
    subprocess.run(cmd, check=True)

def ensure_dirs():
    if not os.path.isdir(VIDEO_DIR):
        os.makedirs(VIDEO_DIR, exist_ok=True)

def main():
    # Validate required envs early
    profile = require_env("TIKTOK_PROFILE")
    require_env("FB_PAGE_LINK")
    require_env("FB_COOKIES_PATH")

    ensure_dirs()

    print(f"[{datetime.now()}] 🔍 Checking TikTok profile: {profile}")
    video_url, caption = get_latest_video(profile)

    if not video_url:
        print(f"[{datetime.now()}] ℹ️ No new video found.")
        return

    if not caption or not caption.strip():
        caption = os.getenv("FB_CAPTION", "🔥 Auto Upload")

    filename = os.path.join(VIDEO_DIR, f"{int(time.time())}.mp4")
    print(f"[{datetime.now()}] 📥 Downloading: {caption}")
    download_video(video_url, filename)

    print(f"[{datetime.now()}] 📤 Uploading to Facebook Reels...")
    upload_to_facebook(filename, caption)

    if os.path.exists(filename):
        os.remove(filename)
        print(f"[{datetime.now()}] 🧹 Deleted local video file: {filename}")

if __name__ == "__main__":
    main()
