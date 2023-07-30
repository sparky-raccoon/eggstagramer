require("dotenv").config();
const express = require("express");
const { CronJob } = require("cron");
const { generateEgg } = require("./utils");

const app = express();
const port = process.env.PORT || 3000;
app.listen(port);

const login = async () => {
  console.log("Login to Instagram...");
};

const post = async () => {
  console.log("Posting to Instagram...", caption);
  const { image: file, caption } = await generateEgg();
};

const main = async () => {
  try {
    await login();
    const cron = new CronJob("* * * * *", post);
    cron.start();
  } catch (err) {
    console.log(err);
  }
};

main();
