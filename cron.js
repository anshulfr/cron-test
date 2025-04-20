const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

async function testPuppeteerOnRender() {
  console.log('🟡 Starting Puppeteer test on Render...');

  const browser = await puppeteer.launch({ 
    headless: true,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox', 
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });

  try {
    const page = await browser.newPage();

    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const keyword = 'devops';
    const url = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keyword)}&location=India`;

    console.log(`🔗 Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    console.log('⏳ Waiting for job listings to load...');
    try {
      await Promise.race([
        page.waitForSelector('.jobs-search__results-list', { timeout: 10000 }),
        page.waitForSelector('ul.jobs-search-results__list', { timeout: 10000 })
      ]);
    } catch {
      console.log('⚠️ Could not find job listing selector, using fallback wait...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    const jobListings = await page.evaluate(() => {
      const listings = [];
      const jobCards = document.querySelectorAll('.jobs-search__results-list > li, ul.jobs-search-results__list > li');

      Array.from(jobCards).slice(0, 2).forEach(card => {
        const titleElement = card.querySelector('.base-search-card__title, h3.base-card__title');
        const companyElement = card.querySelector('.base-search-card__subtitle, .base-card__subtitle');
        const locationElement = card.querySelector('.job-search-card__location, .job-card-container__metadata-item');
        const linkElement = card.querySelector('a.base-card__full-link, a.base-card');

        if (titleElement && linkElement) {
          listings.push({
            title: titleElement.textContent.trim(),
            company: companyElement ? companyElement.textContent.trim() : "Unknown",
            location: locationElement ? locationElement.textContent.trim() : "Unknown",
            link: linkElement.href
          });
        }
      });

      return listings;
    });

    console.log('✅ Found', jobListings.length, 'job listings');
    jobListings.forEach((job, i) => {
      console.log(`\n🔹 Job ${i + 1}`);
      console.log(`- Title: ${job.title}`);
      console.log(`- Company: ${job.company}`);
      console.log(`- Location: ${job.location}`);
      console.log(`- URL: ${job.link}`);
    });

    const screenshotPath = 'render-test-screenshot.png';
    await page.screenshot({ path: screenshotPath });
    console.log(`🖼️ Screenshot saved as: ${screenshotPath}`);

    // Optional: write results to a file (for debugging)
    fs.writeFileSync('results.json', JSON.stringify(jobListings, null, 2));
    console.log('📝 Results saved to results.json');

  } catch (err) {
    console.error('❌ Error during Puppeteer execution:', err);
  } finally {
    await browser.close();
    console.log('🛑 Browser closed. Exiting...');
  }
}

(async () => {
  console.log('==============================');
  console.log('🔁 Render Puppeteer Worker Run');
  console.log('==============================');
  await testPuppeteerOnRender();
  console.log('✅ Worker job finished');
})();
