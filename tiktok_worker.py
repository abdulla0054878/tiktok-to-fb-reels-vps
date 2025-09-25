import os, requests, json, time
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

PROFILE_URL = os.getenv("TIKTOK_PROFILE")
INTERVAL = int(os.getenv("CRON_INTERVAL_MINUTES", 5)) * 60
VIDEO_DIR = "/root/videos"

def get_latest_video():
    # Simulated API or scraping logic
    response = requests.get(f"https://api.tiktok.fake/latest?profile={PROFILE_URL}")
    data = response.json()
    return data.get("video_url"), data.get("title")

def download_video(url, filename):
    r = requests.get(url, stream=True)
    with open(filename, "wb") as f:
        for chunk in r.iter_content(chunk_size=8192):
            f.write(chunk)
    return filename

def upload_to_facebook(video_path, caption):
    os.system(f'node fb_reels_uploader_final.js "{video_path}" "{caption}"')

def main():
    print(f"[{datetime.now()}] 🔍 Checking TikTok profile...")
    video_url, title = get_latest_video()
    if not video_url:
        print("❌ No new video found.")
        return

    filename = os.path.join(VIDEO_DIR, f"{int(time.time())}.mp4")
    print(f"📥 Downloading: {title}")
    download_video(video_url, filename)

    print("📤 Uploading to Facebook Reels...")
    upload_to_facebook(filename, title)

    if os.path.exists(filename):
        os.remove(filename)
        print("🧹 Deleted local video file.")

if __name__ == "__main__":
    main()
