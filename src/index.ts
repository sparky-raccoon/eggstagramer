import 'dotenv/config';
import { generateEgg, storeEgg } from './utils';
import { Page } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());
const HEADLESS = true;

const getRandomDelayNumber = (type: 'short' | 'long' = 'short') => {
  const min = type === 'short' ? 1000 : 2000;
  const max = type === 'short' ? 1500 : 3000;
  return Math.floor(Math.random() * (max - min + 1) + min)
};

const attemptType = (page: Page, selector: string, text: string, delayType: 'short' | 'long' = 'short'): Promise<void> => {
  console.log("attemptType", selector, text);
  return new Promise(async (resolve, reject) => {
    try {
      await page.waitForSelector(selector);
      await page.type(selector, text, { delay: getRandomDelayNumber(delayType) });
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

const attemptClick = async (page: Page, selector: string, delayType: 'short' | 'long' = 'short'): Promise<void> => {
  console.log("attemptClick", selector);
  return new Promise(async (resolve, reject) => {
    try {
      HEADLESS && (await page.screenshot({ path: `${selector.replace(/[^a-zA-Z0-9]/g, "")}.png` }));
      await page.waitForSelector(selector);
      await page.click(selector, { delay: getRandomDelayNumber(delayType) });
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

const post = async (): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const browser = await puppeteer.launch({
        headless: HEADLESS,
        userDataDir: "/tmp/user-data-dir",
        ignoreHTTPSErrors: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-sync",
          "--ignore-certificate-errors",
          "--lang=en-US,en;q=0.9",
        ],
        ...("darwin" ? {} : { executablePath: "/usr/bin/chromium-browser" }),
      });

      const page = await browser.newPage();
      const headlessUserAgent = await page.evaluate(() => navigator.userAgent);
      const chromeUserAgent = headlessUserAgent.replace("HeadlessChrome", "Chrome");
      await page.setUserAgent(chromeUserAgent);

      page.setDefaultNavigationTimeout(2 * 60 * 1000);

      console.log("Navigating to Instagram...");
      await page.goto("https://instagram.com", { waitUntil: "networkidle2" });
      const alreadyLoggedIn = await page.evaluate(() => {
        const loginButton = document.querySelector("button[type='submit']");
        return loginButton === null;
      });

      if (!alreadyLoggedIn) {
        console.log("Rejecting cookies...");
        await attemptClick(page, 'xpath=//button[contains(text(), "Decline")]');

        console.log("Logging in...");
        await attemptType(page, 'input[name="username"]', process.env.IG_USERNAME);
        await attemptType(page, 'input[name="password"]', process.env.IG_PASSWORD);
        await page.waitForSelector('button[type="submit"]');
        await Promise.all([page.waitForNavigation(), page.click('button[type="submit"]')]);
      } else console.log("Already logged in...");

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
        page.click("xpath=//button[contains(text(), 'Select')]", { delay: getRandomDelayNumber("long") }),
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
      await attemptClick(page, "xpath=//div[@role='button' and contains(text(), 'Share')]", "long");

      browser.close();
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

(async () => {
  try {
    await post();
  } catch (err) {
    console.log(err);
  }

  process.exit();
})();
