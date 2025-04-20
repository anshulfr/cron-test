const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

// Simple test to check if Puppeteer works on Render
async function testPuppeteerOnRender() {
  console.log('Starting Puppeteer test on Render...');
  
  // Launch browser with configurations for cloud environment
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
    console.log('Browser launched successfully');
    const page = await browser.newPage();
    
    // Set a realistic viewport and user agent
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Search for DevOps jobs in India
    const keyword = 'devops';
    const url = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keyword)}&location=India`;
    
    console.log(`Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait for job listings to load
    console.log('Waiting for job listings to load...');
    try {
      await Promise.race([
        page.waitForSelector('.jobs-search__results-list', { timeout: 10000 }),
        page.waitForSelector('ul.jobs-search-results__list', { timeout: 10000 })
      ]);
    } catch (e) {
      console.log('Could not find job listing selector, trying alternative approach...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Extract job data
    console.log('Extracting job listings...');
    const jobListings = await page.evaluate(() => {
      const listings = [];
      const jobCards = document.querySelectorAll('.jobs-search__results-list > li, ul.jobs-search-results__list > li');
      
      // Only get the first 2 jobs
      const limitedCards = Array.from(jobCards).slice(0, 2);
      
      limitedCards.forEach(card => {
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
    
    // Print results
    console.log('Test results:');
    console.log('-------------');
    console.log(`Found ${jobListings.length} job listings`);
    
    if (jobListings.length > 0) {
      console.log('\nJob listings found:');
      jobListings.forEach((job, index) => {
        console.log(`\nJob ${index + 1}:`);
        console.log(`- Title: ${job.title}`);
        console.log(`- Company: ${job.company}`);
        console.log(`- Location: ${job.location}`);
        console.log(`- URL: ${job.link}`);
      });
      console.log('\nPuppeteer test SUCCESSFUL! Render supports Puppeteer for web scraping.');
    } else {
      console.log('\nNo job listings found. This could indicate:');
      console.log('1. LinkedIn blocked the scraping attempt');
      console.log('2. The page structure changed');
      console.log('3. There might be issues with Puppeteer on Render');
    }
    
  } catch (error) {
    console.error('Error during Puppeteer test:', error);
    console.log('\nPuppeteer test FAILED! There might be issues running Puppeteer on Render.');
  } finally {
    // Take a screenshot to help debug if needed
    try {
      const page = (await browser.pages())[0];
      await page.screenshot({ path: 'render-test-screenshot.png' });
      console.log('Screenshot saved as render-test-screenshot.png');
    } catch (e) {
      console.log('Could not take screenshot:', e.message);
    }
    
    // Close the browser
    await browser.close();
    console.log('Browser closed');
  }
}

// Run the test
(async () => {
  console.log('========================================');
  console.log('Puppeteer Test Script for Render');
  console.log('========================================');
  console.log('Testing if Render supports Puppeteer...');
  
  try {
    await testPuppeteerOnRender();
  } catch (err) {
    console.error('Fatal error running the test:', err);
  }
  
  console.log('Test completed');
})();