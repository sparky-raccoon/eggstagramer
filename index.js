import { config } from "dotenv";
import fetch from "node-fetch";
import fs from "fs/promises";
// import { generateEgg } from "./utils.js";
config();

// https://developers.facebook.com/docs/facebook-login/for-devices

let loginAttempts = 0;
const login = () => {
  return new Promise(async (resolve, reject) => {
    console.log("Login to Instagram...");
    loginAttempts++;
    if (loginAttempts > 3) {
      reject("Login attempts exceeded.");
      return;
    }

    try {
      const storedToken = await fs.readFile(".user_token", "utf8");
      const [accessToken, dateMs] = storedToken.split("|");
      const todayMs = new Date().getTime();
      const daysSinceLastLogin = (todayMs - dateMs) / 1000 / 60 / 60 / 24;
      if (daysSinceLastLogin < 60) {
        resolve(accessToken);
        return;
      } else console.log("Stored token has expired.");
    } catch (err) {
      console.log("No stored token found.");
    }

    const response = await fetch(
      `https://graph.facebook.com/v2.6/device/login?access_token=${process.env.IG_TOKEN}&scope=instagram_basic,instagram_content_publish}`,
      { method: "POST" }
    );
    const {
      code,
      user_code: userCode,
      verification_uri: verificationUri,
    } = await response.json();
    console.log(`Authorisation code: ${userCode}, URL: ${verificationUri}`);
    const interval = setInterval(async () => {
      console.log("Polling authorisation status...");
      const response = await fetch(
        `https://graph.facebook.com/v2.6/device/login_status?access_token=${process.env.IG_TOKEN}&code=${code}`,
        { method: "POST" }
      );
      const { error, access_token: accessToken } = await response.json();
      if (error) {
        const { code: errorCode } = error;
        console.log(error.message, errorCode);
        // Session has expired, the whole login process needs to be restarted.
        if (errorCode === 463) {
          clearInterval(interval);
          await login();
        }
      } else if (accessToken) {
        clearInterval(interval);
        const dateMs = new Date().getTime();
        await fs.writeFile(".user_token", `${accessToken}|${dateMs}`);
        resolve(accessToken);
      }
    }, 5000);
  });
};

/* const post = async () => {
  console.log("Posting to Instagram...", caption);
  const { image: file, caption } = await generateEgg();
}; */

const main = async () => {
  try {
    const token = await login();
    console.log(token);
  } catch (err) {
    console.log(err);
  }
};

main();
