import os, time, requests, subprocess
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

PROFILE_URL = os.getenv("TIKTOK_PROFILE")
VIDEO_DIR = "/root/videos"

def require_env(name: str) -> str:
    val = os.getenv(name)
    if not val:
        raise RuntimeError(f"✘ Please set {name} environment variable")
    return val

def get_latest_video(profile_url: str):
    # TODO: এখানে আসল TikTok scraping/downloader logic বসাতে হবে
    # Placeholder: কোনো নতুন ভিডিও নেই
    return (None, None)

def download_video(url: str, out_path: str):
    with requests.get(url, stream=True, timeout=60) as r:
        r.raise_for_status()
        with open(out_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)

def upload_to_facebook(video_path: str, caption: str):
    cmd = ['node', 'fb_reels_uploader_final.js', video_path, caption]
    subprocess.run(cmd, check=True)

def main():
    require_env("TIKTOK_PROFILE")
    require_env("FB_PAGE_LINK")
    require_env("FB_COOKIES_PATH")

    if not os.path.isdir(VIDEO_DIR):
        os.makedirs(VIDEO_DIR, exist_ok=True)

    print(f"[{datetime.now()}] 🔍 Checking TikTok profile...")
    video_url, caption = get_latest_video(PROFILE_URL)

    if not video_url:
        print("ℹ️ No new video found.")
        return

    if not caption:
        caption = os.getenv("FB_CAPTION", "🔥 Auto Upload")

    filename = os.path.join(VIDEO_DIR, f"{int(time.time())}.mp4")
    print(f"📥 Downloading: {caption}")
    download_video(video_url, filename)

    print("📤 Uploading to Facebook Reels...")
    upload_to_facebook(filename, caption)

    if os.path.exists(filename):
        os.remove(filename)
        print("🧹 Deleted local video file.")

if __name__ == "__main__":
    main()
