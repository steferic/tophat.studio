#!/usr/bin/env node

/**
 * Full-page screenshot capture script
 *
 * Usage:
 *   node scripts/capture-screenshot.js <url> [output-name]
 *
 * Examples:
 *   node scripts/capture-screenshot.js https://linear.app linear
 *   node scripts/capture-screenshot.js https://stripe.com stripe
 *
 * Requirements:
 *   npm install puppeteer
 */

const puppeteer = require('puppeteer');
const path = require('path');

const url = process.argv[2];
const outputName = process.argv[3] || 'screenshot';

if (!url) {
  console.error('Usage: node scripts/capture-screenshot.js <url> [output-name]');
  console.error('Example: node scripts/capture-screenshot.js https://linear.app linear');
  process.exit(1);
}

async function captureFullPageScreenshot() {
  console.log(`📸 Capturing full-page screenshot of ${url}...`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Set a desktop viewport
  await page.setViewport({
    width: 1440,
    height: 900,
    deviceScaleFactor: 2, // Retina quality
  });

  // Navigate to the page
  await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });

  // Wait a bit for any animations to settle
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Optional: Scroll to load lazy images
  await autoScroll(page);

  // Wait for lazy-loaded content
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Scroll back to top
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(resolve => setTimeout(resolve, 500));

  const outputPath = path.join(__dirname, '..', 'public', 'screenshots', `${outputName}.png`);

  // Take full page screenshot
  await page.screenshot({
    path: outputPath,
    fullPage: true,
    type: 'png',
  });

  await browser.close();

  console.log(`✅ Screenshot saved to: public/screenshots/${outputName}.png`);
  console.log(`\n📝 To use in your video, set screenshotPath to: "screenshots/${outputName}.png"`);
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

captureFullPageScreenshot().catch(console.error);
