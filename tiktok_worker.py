import os
import time
import schedule
from yt_dlp import YoutubeDL
import subprocess

# TikTok Profile URL ENV থেকে নেবে
TIKTOK_PROFILE = os.getenv("TIKTOK_PROFILE")
CHECK_INTERVAL = int(os.getenv("CRON_INTERVAL_MINUTES", "5"))

if not TIKTOK_PROFILE:
    raise RuntimeError("❌ Please set TIKTOK_PROFILE environment variable")

seen_ids = set()

def check_new_videos():
    print("🔍 Checking TikTok:", TIKTOK_PROFILE)
    try:
        ydl_opts = {"extract_flat": True, "quiet": True, "skip_download": True}
        with YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(TIKTOK_PROFILE, download=False)
            entries = info.get("entries", [])
            if not entries:
                print("❌ No videos found")
                return

            latest = entries[0]
            vid_id = latest.get("id")
            url = latest.get("url")
            title = latest.get("title", "🚀 Auto Reel Upload")

            if not vid_id or vid_id in seen_ids:
                print("⏳ No new video")
                return

            seen_ids.add(vid_id)
            filepath = f"/tmp/{vid_id}.mp4"
            dl_opts = {"outtmpl": filepath, "format": "mp4"}
            with YoutubeDL(dl_opts) as ydl2:
                ydl2.download([url])
            print("📥 Downloaded:", filepath)

            subprocess.run(
                ["node", "fb_reels_uploader_final.js", filepath, title],
                check=True
            )

            os.remove(filepath)
            print("🧹 Deleted:", filepath)

    except Exception as e:
        print("❌ Error:", str(e))

# প্রথমবার চালু হওয়া মাত্র একবার চেক করবে
check_new_videos()
schedule.every(CHECK_INTERVAL).minutes.do(check_new_videos)

print(f"🚀 Worker running every {CHECK_INTERVAL} minutes...")
while True:
    schedule.run_pending()
    time.sleep(5)
