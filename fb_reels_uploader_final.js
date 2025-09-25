const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const delay = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  try {
    const videoPath = process.argv[2];
    const captionText = process.argv[3] || process.env.FB_CAPTION || "🚀 Auto Reel Upload";

    if (!videoPath) throw new Error("❌ Video path missing!");

    console.log("📥 Starting upload:", videoPath);

    const browser = await puppeteer.launch({
      headless: "new",
      executablePath: "/usr/bin/chromium-browser",
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
    });

    const page = await browser.newPage();

    // ✅ Cookies load
    let cookiesData = [];
    try {
      if (process.env.FB_COOKIES) {
        cookiesData = JSON.parse(process.env.FB_COOKIES);
        console.log("✅ FB_COOKIES loaded from ENV");
      } else {
        cookiesData = JSON.parse(fs.readFileSync("cookies.json", "utf-8"));
        console.log("✅ FB_COOKIES loaded from cookies.json file");
      }
    } catch (e) {
      console.error("❌ Could not load cookies:", e.message);
    }

    if (cookiesData.length > 0) {
      await page.setCookie(...cookiesData.map(c => { delete c.sameSite; return c; }));
      console.log("✅ Cookies applied");
    } else {
      console.error("❌ No cookies found!");
      await browser.close();
      process.exit(1);
    }

    // ✅ FB PAGE link open
    const PAGE_LINK = process.env.FB_PAGE_LINK;
    if (!PAGE_LINK) throw new Error("❌ FB_PAGE_LINK not set!");
    await page.goto(PAGE_LINK, { waitUntil: "networkidle2" });
    await delay(7000);

    // Utility clicker
    async function clickBtn(frame, texts) {
      for (let txt of texts) {
        const handle = await frame.evaluateHandle(t => {
          const els = [...document.querySelectorAll('div[role="button"], span, div[aria-label]')];
          return els.find(el =>
            (el.innerText && el.innerText.trim().includes(t)) ||
            (el.getAttribute("aria-label") && el.getAttribute("aria-label").includes(t))
          ) || null;
        }, txt);
        const el = handle.asElement();
        if (el) {
          await el.click();
          console.log("👉 Clicked:", txt);
          await delay(3000);
          return true;
        }
      }
      return false;
    }

    await clickBtn(page, ["Switch Now", "সুইচ"]);

    // Go to Reels composer
    await page.goto("https://www.facebook.com/reels/create/", { waitUntil: "networkidle2" });
    await delay(10000);

    let composer = page.frames().find(f => f.url().includes("reel")) || page;

    // Upload video
    const fileField = await composer.$('input[type=file][accept*="video"]');
    if (!fileField) throw new Error("⚠️ File input not found!");
    await fileField.uploadFile(videoPath);
    console.log("📤 Video attached");

    // Next → Next
    await clickBtn(composer, ["Next", "পরবর্তী"]);
    await clickBtn(composer, ["Next", "পরবর্তী"]);

    // Caption with fallback
    try {
      let box = await composer.$('div[role="textbox"][contenteditable="true"]');
      if (!box) {
        box = await composer.$('div[aria-label*="Write"], div[aria-label*="লিখুন"]');
      }
      if (box) {
        await box.type(captionText, { delay: 40 });
        console.log("✍️ Caption added");
      } else {
        console.warn("⚠️ Caption box not found, skipping...");
      }
    } catch (e) {
      console.warn("⚠️ Caption step failed:", e.message);
    }

    // Publish with fallback
    async function clickPublish(frame) {
      const selectors = [
        'div[aria-label*="Publish"]',
        'div[aria-label*="প্রকাশ"]',
        'div[aria-label*="Share"]',
        'span:contains("Publish")',
        'span:contains("প্রকাশ")',
        'span:contains("Share now")'
      ];
      for (let sel of selectors) {
        try {
          const btn = await frame.$(sel);
          if (btn) {
            await btn.click();
            console.log("✅ Reel Published!");
            return true;
          }
        } catch {}
      }
      console.error("❌ Publish button not found!");
      return false;
    }

    await clickPublish(composer);

    await delay(5000); // wait for publish to complete
    await browser.close();

    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
      console.log("🧹 Deleted:", videoPath);
    }

  } catch (err) {
    console.error("❌ Fatal ERROR:", err);
    process.exit(1);
  }
})();
