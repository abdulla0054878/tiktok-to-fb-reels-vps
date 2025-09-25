const puppeteer = require("puppeteer-core");
const fs = require("fs");
require("dotenv").config();

(async () => {
  const videoPath = process.argv[2];
  const captionText = process.argv[3] || process.env.FB_CAPTION || "🔥 Auto Upload";

  if (!videoPath || !fs.existsSync(videoPath)) {
    console.error("❌ Video file missing!");
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "/usr/bin/chromium-browser",
    args: ["--no-sandbox"]
  });

  const page = await browser.newPage();

  const cookies = JSON.parse(fs.readFileSync("cookies.json", "utf-8"));
  await page.setCookie(...cookies);

  await page.goto(process.env.FB_PAGE_LINK, { waitUntil: "networkidle2" });
  await page.waitForTimeout(5000);

  await page.goto("https://www.facebook.com/reels/create/", { waitUntil: "networkidle2" });
  await page.waitForTimeout(10000);

  const fileInput = await page.$('input[type="file"]');
  await fileInput.uploadFile(videoPath);

  await page.waitForTimeout(5000);
  const captionBox = await page.$('div[role="textbox"]');
  if (captionBox) await captionBox.type(captionText, { delay: 40 });

  const publishBtn = await page.$x("//span[contains(text(),'Publish') or contains(text(),'প্রকাশ')]");
  if (publishBtn.length) await publishBtn[0].click();

  await page.waitForTimeout(5000);
  await browser.close();

  fs.unlinkSync(videoPath);
  console.log("✅ Uploaded and cleaned up.");
})();
