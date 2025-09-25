require('dotenv').config();

module.exports = {
  apps: [
    {
      name: "tiktok-fb-bot",
      script: "./update.sh",
      interpreter: "bash",
      cron_restart: `*/${process.env.CRON_INTERVAL_MINUTES || 5} * * * *`,
      env: {
        TIKTOK_PROFILE: process.env.TIKTOK_PROFILE,
        FB_PAGE_LINK: process.env.FB_PAGE_LINK,
        FB_CAPTION: process.env.FB_CAPTION
      }
    }
  ]
};
