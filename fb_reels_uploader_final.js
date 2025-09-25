const fs = require("fs");
require("dotenv").config();
const puppeteer = require("puppeteer-core");

const videoPath = process.argv[2];
const captionText = process.argv[3] || process.env.FB_CAPTION || "🔥 Auto Upload";
const cookiesPath = process.env.FB_COOKIES_PATH || "./cookies.json";
const fbPageLink = process.env.FB_PAGE_LINK;

if (!videoPath || !fs.existsSync(videoPath)) {
  console.error("❌ Video file missing!");
  process.exit(1);
}
if (!fbPageLink) {
  console.error("❌ FB_PAGE_LINK not set in .env");
  process.exit(1);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "/usr/bin/chromium-browser",
    args: ["--no-sandbox"]
  });

  try {
    const page = await browser.newPage();

    if (!fs.existsSync(cookiesPath)) {
      console.error("❌ cookies.json not found");
      process.exit(1);
    }
    const cookies = JSON.parse(fs.readFileSync(cookiesPath, "utf-8"));
    await page.setCookie(...cookies);

    await page.goto(fbPageLink, { waitUntil: "networkidle2" });
    await page.waitForTimeout(4000);

    await page.goto("https://www.facebook.com/reels/create/", { waitUntil: "networkidle2" });
    await page.waitForTimeout(8000);

    const fileInput = await page.$('input[type="file"]');
    await fileInput.uploadFile(videoPath);

    await page.waitForTimeout(4000);
    const captionBox = await page.$('div[role="textbox"]') || await page.$('[contenteditable="true"]');
    if (captionBox) {
      await captionBox.type(captionText, { delay: 35 });
    }

    const publishBtn = await page.$x("//span[contains(text(),'Publish') or contains(text(),'প্রকাশ')]");
    if (publishBtn.length) {
      await publishBtn[0].click();
    } else {
      console.error("❌ Publish button not found");
    }

    await page.waitForTimeout(7000);
    console.log("✅ Uploaded to Facebook Reels.");

  } finally {
    await browser.close();
    try {
      fs.unlinkSync(videoPath);
      console.log("🧹 Cleaned local video file.");
    } catch {}
  }
})();
