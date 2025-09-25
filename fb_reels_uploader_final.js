const fs = require("fs");
require("dotenv").config();
const puppeteer = require("puppeteer-core");

const videoPath = process.argv[2];
const captionText = process.argv[3] || process.env.FB_CAPTION || "🔥 Auto Upload";
const cookiesPath = process.env.FB_COOKIES_PATH || "./cookies.json";
const fbPageLink = process.env.FB_PAGE_LINK;

function exitWith(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

if (!videoPath || !fs.existsSync(videoPath)) exitWith("❌ Video file missing!");
if (!fbPageLink) exitWith("❌ FB_PAGE_LINK not set in .env");

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "/usr/bin/chromium-browser",
    args: ["--no-sandbox"]
  });

  try {
    const page = await browser.newPage();

    // Load cookies
    if (!fs.existsSync(cookiesPath)) exitWith("❌ cookies.json not found");
    const cookies = JSON.parse(fs.readFileSync(cookiesPath, "utf-8"));
    await page.setCookie(...cookies);

    // Warm up session
    await page.goto(fbPageLink, { waitUntil: "networkidle2" });
    await page.waitForTimeout(4000);

    // Go to Reels composer
    await page.goto("https://www.facebook.com/reels/create/", { waitUntil: "networkidle2" });
    await page.waitForTimeout(8000);

    // Upload file
    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) exitWith("❌ File input not found");
    await fileInput.uploadFile(videoPath);

    // Caption box (fallback: role textbox or contenteditable)
    await page.waitForTimeout(4000);
    const captionBox = await page.$('div[role="textbox"]') || await page.$('[contenteditable="true"]');
    if (captionBox) {
      await captionBox.focus();
      await captionBox.type(captionText, { delay: 35 });
    }

    // Publish button (English/Bengali fallback)
    const publishCandidates = [
      "//span[contains(text(),'Publish')]",
      "//span[contains(text(),'প্রকাশ')]",
      "//div[@role='button']//span[contains(text(),'Publish') or contains(text(),'প্রকাশ')]"
    ];
    let clicked = false;
    for (const xpath of publishCandidates) {
      const btns = await page.$x(xpath);
      if (btns.length) {
        await btns[0].click();
        clicked = true;
        break;
      }
    }
    if (!clicked) exitWith("❌ Publish button not found");

    // Wait a bit for completion
    await page.waitForTimeout(7000);
    console.log("✅ Uploaded to Facebook Reels.");

  } finally {
    await browser.close();
    // Cleanup local file
    try {
      fs.unlinkSync(videoPath);
      console.log("🧹 Cleaned local video file.");
    } catch (e) {
      // ignore
    }
  }
})();
