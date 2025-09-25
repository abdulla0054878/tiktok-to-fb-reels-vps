const puppeteer = require("puppeteer");
const fs = require("fs");

const delay = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  try {
    const videoPath = process.argv[2];
    const captionText = process.argv[3] || process.env.FB_CAPTION || "🚀 Auto Reel Upload";

    if (!videoPath) throw new Error("❌ Video path missing!");

    console.log("📥 Starting upload:", videoPath);

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
    });
    const page = await browser.newPage();

    // ✅ Cookies লোড করা (ENV → নাহলে cookies.json ফাইল থেকে)
    let cookiesData = [];
    if (process.env.FB_COOKIES) {
      try {
        cookiesData = JSON.parse(process.env.FB_COOKIES);
        console.log("✅ FB_COOKIES loaded from ENV");
      } catch (e) {
        console.error("❌ Invalid FB_COOKIES:", e.message);
      }
    } else {
      try {
        cookiesData = JSON.parse(fs.readFileSync("cookies.json", "utf-8"));
        console.log("✅ FB_COOKIES loaded from cookies.json file");
      } catch (e) {
        console.error("❌ Could not load cookies.json:", e.message);
      }
    }

    if (cookiesData.length > 0) {
      await page.setCookie(...cookiesData.map(c => { delete c.sameSite; return c; }));
      console.log("✅ Cookies applied");
    } else {
      console.error("❌ No cookies found!");
      await browser.close();
      process.exit(1);
    }

    // FB Page Link ওপেন করুন
    const PAGE_LINK = process.env.FB_PAGE_LINK;
    if (!PAGE_LINK) throw new Error("❌ FB_PAGE_LINK not set!");
    await page.goto(PAGE_LINK, { waitUntil: "networkidle2" });
    await delay(7000);

    // Switch Now try
    async function clickBtn(frame, texts) {
      for (let t of texts) {
        const handle = await frame.evaluateHandle(txt => {
          const els = [...document.querySelectorAll('div[role="button"], span')];
          return els.find(el => el.innerText && el.innerText.trim().includes(txt)) || null;
        }, t);
        const el = handle.asElement();
        if (el) {
          await el.click();
          console.log("👉 Clicked:", t);
          await delay(3000);
          return true;
        }
      }
      return false;
    }
    await clickBtn(page, ["Switch Now", "সুইচ"]);

    // Reels Composer খুলুন
    await page.goto("https://www.facebook.com/reels/create/", { waitUntil: "networkidle2" });
    await delay(10000);
    let composer = page.frames().find(f => f.url().includes("reel")) || page;

    // Video আপলোড
    const fileField = await composer.$('input[type=file][accept*="video"]');
    if (!fileField) throw new Error("⚠️ File input not found!");
    await fileField.uploadFile(videoPath);
    console.log("📤 Video attached");

    // Next → Next
    await clickBtn(composer, ["Next", "পরবর্তী"]);
    await clickBtn(composer, ["Next", "পরবর্তী"]);

    // Caption
    try {
      const box = await composer.waitForSelector('div[role="textbox"][contenteditable="true"]',
        { visible: true, timeout: 60000 });
      await box.type(captionText, { delay: 40 });
      console.log("✍️ Caption:", captionText);
    } catch {
      console.warn("⚠️ Caption box not found, skipping...");
    }

    // Publish
    await clickBtn(composer, ["Publish", "প্রকাশ", "Share now"]);
    console.log("✅ Reel Published!");

    await browser.close();
    fs.unlinkSync(videoPath);

  } catch (err) {
    console.error("❌ Fatal ERROR:", err);
    process.exit(1);
  }
})();
