import os, requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# load environment variables
load_dotenv()

TIKTOK_PROFILE = os.getenv("TIKTOK_PROFILE")
DOWNLOAD_DIR = "./downloads"
VIDEO_FILE = os.path.join(DOWNLOAD_DIR, "latest.mp4")

if not os.path.exists(DOWNLOAD_DIR):
    os.makedirs(DOWNLOAD_DIR)

def get_latest_video():
    headers = {"User-Agent": "Mozilla/5.0"}
    r = requests.get(TIKTOK_PROFILE, headers=headers)
    soup = BeautifulSoup(r.text, "html.parser")
    for a in soup.find_all("a", href=True):
        if "/video/" in a['href']:
            return "https://www.tiktok.com" + a['href']
    return None

def download_video(url):
    os.system(f'yt-dlp -o "{VIDEO_FILE}" {url}')

if __name__ == "__main__":
    url = get_latest_video()
    if url:
        print(f"[INFO] Found video: {url}")
        download_video(url)
        print(f"[INFO] Downloaded: {VIDEO_FILE}")
    else:
        print("[INFO] No new video found.")
