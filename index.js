import puppeteer from 'puppeteer';
import fs from 'fs';

async function getProducts() {
    const browser = await puppeteer.launch({
    headless: false // Opens visible browser
    });

    const page = await browser.newPage();
    await page.goto('https://www.coop.se/butiker-erbjudanden/coop/coop-skurup/');

    await page.waitForSelector('div.Rnj2piQi button.Wy2NiM6K.tkw4k9hc.dIzgXmHF'); // wait for the visa alla buttons to appear
    await page.evaluate(() => {
        const buttons = document.querySelectorAll('div.Rnj2piQi button.Wy2NiM6K.tkw4k9hc.dIzgXmHF');
        buttons.forEach(button => button.click());
    }); // click all visa alla buttons to make all products appear on the page

    const productElements = await page.$$('div.ProductTeaser');

    for (const productElement of productElements) {
        await scrapeProductData(productElement, false);
    }
    

    await browser.close();
}


async function scrapeProductVariants(productElement) {
    let variants = [];

    // Get the parent of productElement, then find the div within it
    const variantsDiv = await productElement.evaluateHandle(element => {
        element.querySelector('.Wy2NiM6K.iyTkejCQ.nZnVqEJd.mOvy16Ff').click();

        const parent = element.parentElement;
        let sibling = parent.nextElementSibling;
        // Keep going through siblings until we find the div containing the products variants
        while (sibling) {
            if (sibling.matches('div.Grid-cell.u-sizeFull.u-paddingAz')) {
                return sibling;
            }
            sibling = sibling.nextElementSibling;
        }
        return null; // Not found
    });

    
    const variantsElements = await variantsDiv.$$('div.ProductTeaser');

    for (const productElement of variantsElements) {
        variants.push(await scrapeProductData(productElement, true));
    }
    
    return variants;
}

async function scrapeProductData(productElement, isVariant) {
  const productData = await productElement.evaluate(element => {
    const title = element.querySelector('h3.ProductTeaser-heading')?.textContent?.trim() || null;
    const price = element.querySelector('div.OXm1GQVM')?.textContent?.trim() || element.querySelector('div.lQkA89R')?.textContent?.trim() || null;
    const cents = element.querySelector('.uHKGEzxo')?.textContent?.trim() || element.querySelector('.W4Xpjgmp')?.textContent?.trim() || null;
    const unit = element.querySelector('.ew9hNB6_')?.textContent?.trim() || element.querySelector('.kk5N_OPI')?.textContent?.trim() || null;
    const deal =  element.querySelector('.QUeU6xhZ')?.textContent?.trim() || null;
    const size =  element.querySelector('.EnRQ98Sx.Nk9lLHfd.ahPAzIfS')?.textContent?.trim() || null;
    const brand =  element.querySelector('div.ProductTeaser-brand')?.textContent?.trim() || null;
    const comparisonPrice = element.querySelector('.nEatcoiG :nth-of-type(3)')?.textContent?.trim() || null;
    const image = element.querySelector('div.ProductTeaser-image img')?.src || null;
    const isMember = element.querySelector('.SlFPVeq_') ? true : false;
    const badges = Array.from(element.querySelectorAll('.ProductTeaser-badges img')).map(img => img.src) || null;
    const hasVariants = element.querySelector('.Wy2NiM6K.iyTkejCQ.nZnVqEJd.mOvy16Ff') !== null;
        
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
      badges,
      hasVariants
    };
  });
  
    // if the product has variants and itself is not variant of another product then scrape the variants of that product
    if (!isVariant && productData.hasVariants) {
        productData.variants = await scrapeProductVariants(productElement);
        delete productData.hasVariants;
    }

    // if the product is not a variant of another product then add the product as its own product in json
    if (!isVariant) {
        pushProductsToJson(productData);
    }

    console.log(`Scraped: ${productData.title}`);
    return productData;
}

let products = [];

async function pushProductsToJson(productData) {
    products.push(productData);
  
    // Save to JSON file
    fs.writeFileSync('products.json', JSON.stringify(products, null, 2));

}

getProducts();