import puppeteer from 'puppeteer';
import fs from 'fs';


async function selectStore(city) {
    await page.waitForSelector('button.sc-c4efe7e1-0.pxtOL.sc-59bd60e8-1.fnKnyn'); // wait for the välj butik button
    await page.evaluate(() => {
        const button = document.querySelector('button.sc-c4efe7e1-0.pxtOL.sc-59bd60e8-1.fnKnyn');
        button.click();
    });


    // Wait for input field to be visible and ready
    await page.waitForSelector('input.sc-d4570efb-0.daXCoF.sc-75ef2bb4-2.hwqXAv')

    // Click the input field and type the city
    await page.click('input.sc-d4570efb-0.daXCoF.sc-75ef2bb4-2.hwqXAv');
    await page.type('input.sc-d4570efb-0.daXCoF.sc-75ef2bb4-2.hwqXAv', city);
    
    await page.waitForSelector('div.sc-b9509ac6-0.bJPXdQ');

    await page.evaluate(() => {
        const div = document.querySelector('div.sc-b9509ac6-0.bJPXdQ');
        div.click();
    });

    await page.waitForSelector('div.sc-9f1d623-0.hPisLW') // wait for the first product to appear
}

async function loadProducts() {

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Get expected number of products from the paragraph
    const expectedCount = await page.evaluate(() => {
        const el = document.querySelector('p.sc-117d48af-0.dGUcxD');
        if (!el) return 0;
        const match = el.innerText.match(/\d+/); // e.g. "200 varor"
        return match ? parseInt(match[0]) : 0;
    });

    console.log(`Expecting ${expectedCount} products...`);

    let currentCount = 0

    while (currentCount < expectedCount) {
        // Count loaded products
        currentCount = await page.evaluate(() =>
            document.querySelectorAll('div.sc-9f1d623-0.hPisLW').length
        );
        // Scroll to bottom
        await page.evaluate(() => {
            const products = document.querySelectorAll('div.sc-9f1d623-22.bAGJCb'); // product cards
            const lastProduct = products[products.length - 1];
            if (lastProduct) {
                lastProduct.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
        });
    }

    console.log(`✅ Done! Total loaded: ${currentCount} products.`);
}

let page;

async function getProducts() {
    const browser = await puppeteer.launch({
    headless: false // Opens visible browser
    });

    page = await browser.newPage();
    await page.goto('https://www.willys.se/erbjudanden/butik');

    await selectStore('skurup')
    await loadProducts()

    const productElements = await page.$$('div.sc-9f1d623-0.hPisLW');

    for (const productElement of productElements) {
        await scrapeProductData(productElement);

    }

    await browser.close();
}

async function scrapeProductData(productElement) {
  const productData = await productElement.evaluate(element => {
    const title = element.querySelector('.sc-9f1d623-7.NmxGp')?.textContent?.trim() || null;

    // Brand & size
    const brandSizeText = element.querySelector('.sc-9f1d623-9.dJArYF')?.textContent?.trim() || null;
    let brand = null, size = null;
    if (brandSizeText) {
      const parts = brandSizeText.split(/\s+/);
      brand = parts[0] || null;
      size = parts.slice(1).join(' ') || null;
    }

    // Price info
    const priceMajor = element.querySelector('.sc-4b8cc2f9-2.cCZiOx')?.textContent?.trim() || '0';
    const priceMinor = element.querySelector('.sc-4b8cc2f9-5.ggAScU')?.textContent?.trim() || '00';
    const unit = element.querySelector('.sc-4b8cc2f9-6.jxQDEl')?.textContent?.trim() || null;
    const price = `${priceMajor}.${priceMinor}`;

    // Deal type (e.g. "5 för", "3 för")
    const deal = element.querySelector('.sc-9f1d623-14.bhpxzP')?.textContent?.trim() || null;

    // Multiple labels
    const badges = Array.from(element.querySelectorAll('.sc-9f1d623-19.dmiNIE img'))
      .map(img => ({ src: img.getAttribute('src') || null,}));

    // Check if membership price (Willys Plus)
    const isMemeber = !!element.querySelector('.sc-4b8cc2f9-7.chdLmu svg');

    // Image
    const image = element.querySelector('img[itemprop="image"]')?.src || null;

    return {
      title,
      brand,
      size,
      price,
      unit,
      deal,
      badges,
      isMemeber,
      image
    };
  });

  pushProductsToJson(productData);
}



let products = [];

async function pushProductsToJson(productData) {
    products.push(productData);
  
    // Save to JSON file
    fs.writeFileSync('willys.json', JSON.stringify(products, null, 2));

}

getProducts();