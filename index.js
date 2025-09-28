import puppeteer from 'puppeteer';
import fs from 'fs';

async function scrapeProducts() {
    const browser = await puppeteer.launch({
    headless: false // Opens visible browser
    });

    const page = await browser.newPage();
    await page.goto('https://www.coop.se/butiker-erbjudanden/coop/coop-skurup/');

    await page.waitForSelector('div.Rnj2piQi button.Wy2NiM6K.tkw4k9hc.dIzgXmHF'); /* wait for the visa alla buttons to appear */
    await page.evaluate(() => {
        const buttons = document.querySelectorAll('div.Rnj2piQi button.Wy2NiM6K.tkw4k9hc.dIzgXmHF');
        buttons.forEach(button => button.click());
    }); /* click all visa alla buttons to make all products appear on the page */

    const productElements = await page.$$('div.ProductTeaser');

    for (const productElement of productElements) {
        await scrapeProductData(productElement);
    }
    

    await browser.close();
}

let products = [];

async function scrapeProductData(productElement) {
  const productData = await productElement.evaluate(element => {
    const title = element.querySelector('h3.ProductTeaser-heading')?.textContent?.trim() || null;
    const price = element.querySelector('div.OXm1GQVM')?.textContent?.trim() || element.querySelector('div.lQkA89R')?.textContent?.trim() || null;
    const cents = element.querySelector('.uHKGEzxo')?.textContent?.trim() || element.querySelector('.W4Xpjgmp')?.textContent?.trim() || null;
    const unit = element.querySelector('.ew9hNB6_')?.textContent?.trim() || element.querySelector('.kk5N_OPI')?.textContent?.trim() || null;
    const deal =  element.querySelector('.QUeU6xhZ')?.textContent?.trim() || null
    const size =  element.querySelector('.EnRQ98Sx.Nk9lLHfd.ahPAzIfS')?.textContent?.trim() || null
    const brand =  element.querySelector('div.ProductTeaser-brand')?.textContent?.trim() || null
    const comparisonPrice = element.querySelector('.nEatcoiG :nth-of-type(3)')?.textContent?.trim() || null
    const image = element.querySelector('div.ProductTeaser-image img')?.src || null;
    const isMember = element.querySelector('.SlFPVeq_') ? true : false
    const badges = Array.from(element.querySelectorAll('.ProductTeaser-badges img')).map(img => img.src) || null
        
    return {
      title,
      price,
      cents,
      unit,
      deal,
      size,
      brand,
      comparisonPrice,
      image,
      isMember,
      badges
    };
  });
  
  products.push(productData);
  
  // Save to JSON file
  fs.writeFileSync('products.json', JSON.stringify(products, null, 2));
  
  console.log(`Scraped: ${productData.title}`);
}

scrapeProducts();