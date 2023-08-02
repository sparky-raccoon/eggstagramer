require("dotenv").config();
const express = require("express");
// const { CronJob } = require("cron");
const { generateEgg } = require("./utils");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

const app = express();
const port = process.env.PORT || 3000;
app.listen(port);

const post = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  console.log("Login to Instagram...");
  await page.goto("https://instagram.com");

  const { image: file, caption } = await generateEgg();
  console.log("Posting to Instagram...", caption);

  browser.close();
};

(async () => {
  try {
    console.log("Starting...");
    await post();
    // const cron = new CronJob("* * * * *", post);
    // cron.start();
  } catch (err) {
    console.log(err);
  }
})();
