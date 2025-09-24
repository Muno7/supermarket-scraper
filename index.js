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
    const title = element.querySelector('h3.ProductTeaser-heading')?.textContent?.trim() || 'No title';
    const price = element.querySelector('div.OXm1GQVM')?.textContent?.trim() || element.querySelector('div.lQkA89R')?.textContent?.trim() || 'No price';
    const image = element.querySelector('div.ProductTeaser-image img')?.src || 'No image';
    
    return {
      title,
      price, 
      image
    };
  });
  
  products.push(productData);
  
  // Save to JSON file
  fs.writeFileSync('products.json', JSON.stringify(products, null, 2));
  
  console.log(`Scraped: ${productData.title}`);
}

scrapeProducts();