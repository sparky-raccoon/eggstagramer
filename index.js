require("dotenv").config();
const express = require("express");
// const { CronJob } = require("cron");
const { generateEgg, storeEgg } = require("./utils");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

const app = express();
const port = process.env.PORT || 3000;
app.listen(port);

const attemptType = async (page, selector, text) => {
  console.log("attemptType", selector, text);
  try {
    const res = await page.waitForSelector(selector);
    console.log(res);
    await page.type(selector, text, { delay: 100 });
  } catch (err) {
    console.log(err);
  }
};

const attemptClick = async (page, selector) => {
  console.log("attemptClick", selector);
  try {
    const res = await page.waitForSelector(selector);
    console.log(res);
    await page.click(selector);
  } catch (err) {
    console.log(err);
  }
};

const post = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(2 * 60 * 1000);

  console.log("Navigating to Instagram...");
  await page.goto("https://instagram.com", { waitUntil: "networkidle2" });

  console.log("Rejecting cookies...");
  await attemptClick(page, 'xpath=//button[contains(text(), "Decline")]');

  console.log("Logging in...");
  await attemptType(page, 'input[name="username"]', process.env.IG_USERNAME);
  await attemptType(page, 'input[name="password"]', process.env.IG_PASSWORD);
  await page.waitForSelector('button[type="submit"]');
  await Promise.all([page.waitForNavigation(), page.click('button[type="submit"]')]);

  console.log("Initiating post...");
  const createPostSelector = "xpath=//a//*[name()='svg' and @aria-label='New post']";
  await attemptClick(page, createPostSelector);

  console.log("Generating egg...");
  const { buffer, name } = await generateEgg();

  console.log("Storing generated egg...");
  const eggPath = storeEgg(buffer, name);

  console.log("Uploading image...");
  const [fileChooser] = await Promise.all([
    page.waitForFileChooser(),
    page.click("xpath=//button[contains(text(), 'Select')]"),
  ]);
  await fileChooser.accept([eggPath]);

  console.log("Adding caption...");
  await attemptClick(page, "xpath=//div[@role='button' and contains(text(), 'Next')]");
  await attemptClick(page, "xpath=//div[@role='button' and contains(text(), 'Next')]");
  const hashtags = [
    "#egg",
    "#eggs",
    "#eggsofinstagram",
    "#eggstagram",
    "#eggcellent",
    "#eggception",
    "#friedeggs",
    "#generatedeggs",
    "#eggmeme",
  ];
  for (let i = hashtags.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * i);
    const temp = hashtags[i];
    hashtags[i] = hashtags[j];
    hashtags[j] = temp;
  }
  const caption = `"${name}"\n\n${hashtags.join(" ")}`;
  await attemptType(page, "div[role='textbox']", caption);

  console.log("Posting to Instagram...", caption);
  await attemptClick(page, "xpath=//div[@role='button' and contains(text(), 'Share')]");

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
