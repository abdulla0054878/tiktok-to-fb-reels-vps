const fs = require("fs");
require("dotenv").config();
const { chromium } = require("playwright");

const FB_PAGE_LINK = process.env.FB_PAGE_LINK;
const FB_CAPTION = process.env.FB_CAPTION || "🔥 Auto Upload";
const COOKIES_PATH = process.env.FB_COOKIES_PATH || "./cookies.json";
const VIDEO_FILE = "./downloads/latest.mp4";

(async () => {
  if (!fs.existsSync(VIDEO_FILE)) {
    console.log("[INFO] No video file found.");
    process.exit(0);
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  const cookies = JSON.parse(fs.readFileSync(COOKIES_PATH, "utf-8"));
  await context.addCookies(cookies);
  const page = await context.newPage();

  await page.goto(FB_PAGE_LINK);
  console.log("[INFO] Uploading video...");

  await page.setInputFiles('input[type="file"]', VIDEO_FILE);
  await page.waitForTimeout(5000);

  try {
    await page.fill("textarea", FB_CAPTION);
  } catch(e) {
    console.log("[WARN] Caption textarea not found.");
  }

  await page.click('button:has-text("Post")');
  console.log("[INFO] ✅ Upload complete");

  await browser.close();
})();
