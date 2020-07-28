const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const mongoose = require("mongoose");
const Record = require("./model/record");
const Image = require("./model/image");

(async () => {
  await mongoose
    .connect("mongodb://127.0.0.1:27017/mzt?authSource=admin", {
      user: "shen",
      pass: "dwyane3wade",
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .catch((err) => {
      console.error(err);
    });

  console.log("数据库连接成功");

  // 1 - 252
  for (let i = 1; i <= 251; i++) {
    console.log("爬取页码", i);
    await getRecordOnPage(i);
  }
})();

async function getRecordOnPage(pageNum) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto(`https://www.mzitu.com/page/${pageNum}`, {
    waitUntil: "networkidle0",
  });

  const linksHtml = await page
    .$$eval("#pins > li:not(.box)", (nodes) =>
      nodes.map((node) => node.outerHTML)
    )
    .catch((err) => {
      console.error(err);
    });

  for (let i = 0; i < linksHtml.length; i++) {
    const $ = cheerio.load(linksHtml[i]);
    let detailURL = $("a").attr("href");
    let thumb = $("img").attr("data-original");
    let title = $("img").attr("alt");
    let mztID = detailURL.match(/(\d+)/)[0];

    const checkRecord = await Record.findOne({
      mztID,
      title,
    });

    if (!checkRecord) {
      let res = new Record({
        mztID,
        title,
        thumb,
      });
      await res.save();
    }

    const page = await browser.newPage();
    await page.goto(detailURL, { waitUntil: "networkidle2" });

    // 把图片放入数组，如果不是最后一张，则点击下一页再循环此操作
    console.log("爬取标题：", title);
    await getPicOnPage(page, mztID);
  }
}

async function getPicOnPage(page, mztID) {
  await sleep(myRandom());
  let nextButton = await page.$(".pagenavi a:last-of-type");
  let nextButtonText = await page.$eval(
    ".pagenavi a:last-of-type",
    (node) => node.innerText
  );
  let totalCount = await page.$eval(
    ".pagenavi a:nth-last-of-type(2)",
    (node) => node.innerText
  );
  let image = await page.$eval(".main-image img", (node) =>
    node.getAttribute("src")
  );
  let cancelButton = await page.$("[i-id='cancel']");

  let imagesCount = await Image.count({ mztID });
  if (imagesCount === Number(totalCount)) {
    return;
  }

  if (cancelButton) {
    await cancelButton.click();
  }

  if (image) {
    const checkImage = await Image.findOne({ url: image, mztID });
    if (!checkImage) {
      let imageRes = new Image({
        mztID: mztID,
        url: image,
      });
      await imageRes.save();
      console.log({
        totalCount,
        imagesCount,
      });
    }
  }
  if (nextButtonText === "下一页»") {
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 0 }),
      nextButton.click(),
    ]);
    await page.waitForSelector(".main-image img");
    return await getPicOnPage(page, mztID);
  } else {
    return;
  }
}

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

function myRandom() {
  return Math.random() * 500 + 300;
}
