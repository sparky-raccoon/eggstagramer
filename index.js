require("dotenv").config();
const { generateEgg, storeEgg } = require("./utils");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

const customDelay = async (type = "short") => {
  const delay = (min, max) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, Math.floor(Math.random() * (max - min + 1) + min));
    });
  };

  if (type === "short") await delay(1000, 1500);
  else if (type === "long") await delay(2000, 3000);
};

const attemptType = async (page, selector, text, delayType) => {
  console.log("attemptType", selector, text);
  try {
    await customDelay(delayType);
    await page.waitForSelector(selector);
    await page.type(selector, text, { delay: 100 });
  } catch (err) {
    console.log(err);
  }
};

const attemptClick = async (page, selector, delayType) => {
  console.log("attemptClick", selector);
  try {
    await customDelay(delayType);
    await page.waitForSelector(selector);
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
  await attemptClick(page, createPostSelector, "long");

  console.log("Generating egg...");
  const { buffer, name } = await generateEgg();

  console.log("Storing generated egg...");
  const eggPath = storeEgg(buffer, name);

  console.log("Uploading image...");
  const [fileChooser] = await Promise.all([
    page.waitForFileChooser(),
    page.click("xpath=//button[contains(text(), 'Select')]", "long"),
  ]);
  await fileChooser.accept([eggPath]);

  console.log("Adding caption...");
  await attemptClick(page, "xpath=//div[@role='button' and contains(text(), 'Next')]", "long");
  await attemptClick(page, "xpath=//div[@role='button' and contains(text(), 'Next')]", "long");
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
  await attemptClick(page, "xpath=//div[@role='button' and contains(text(), 'Share')]", 'long');

  browser.close();
};

(async () => {
  try {
    console.log("Starting...");
    await post();
    process.exit();
  } catch (err) {
    console.log(err);
  }
})();
