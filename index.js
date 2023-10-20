require("dotenv").config();
const { generateEgg, storeEgg } = require("./utils");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());
const HEADLESS = true;

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

const attemptType = (page, selector, text, delayType) => {
  console.log("attemptType", selector, text);
  return new Promise(async (resolve, reject) => {
    try {
      await customDelay(delayType);
      await page.waitForSelector(selector);
      await page.type(selector, text, { delay: 100 });
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

const attemptClick = async (page, selector, delayType) => {
  console.log("attemptClick", selector);
  return new Promise(async (resolve, reject) => {
    try {
      await customDelay(delayType);
      HEADLESS && (await page.screenshot({ path: `${selector.replace(/[^a-zA-Z0-9]/g, "")}.png` }));
      await page.waitForSelector(selector);
      await page.click(selector);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

const post = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      const browser = await puppeteer.launch({
        userDataDir: "/tmp/user-data-dir",
        headless: HEADLESS,
      });
      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(2 * 60 * 1000);

      const headlessUserAgent = await page.evaluate(() => navigator.userAgent);
      const chromeUserAgent = headlessUserAgent.replace("HeadlessChrome", "Chrome");
      await page.setUserAgent(chromeUserAgent);
      await page.setExtraHTTPHeaders({
        "accept-language": "en-US,en;q=0.8",
      });

      console.log("Navigating to Instagram...");
      /* await page.goto("https://instagram.com", { waitUntil: "networkidle2" });
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
      await attemptClick(page, "xpath=//div[@role='button' and contains(text(), 'Share')]", "long");
      */

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
