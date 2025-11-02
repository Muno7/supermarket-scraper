import puppeteer from 'puppeteer';
import fs from 'fs';

/* hasVariats = '.articleList' */ /* ul that contains the variants. if the lenght is 1 then false */


async function getProducts() {
    const browser = await puppeteer.launch({
    headless: false // Opens visible browser
    });

    const page = await browser.newPage();
    await page.goto('https://www.ica.se/erbjudanden/ica-supermarket-skurup-1004591/');

    await page.waitForSelector('article.offer-card'); // wait for the products
    const productElements = await page.$$('article.offer-card');

    for (const productElement of productElements) {
        const infoButton = await productElement.$('.offer-card__info-container');
        await infoButton.evaluate(element => {
            element.click()
        });
        await page.waitForSelector('.ids-modal-base__container-inner');
        const productOverlay = await page.$('.ids-modal-base__container-inner');
        await scrapeProductData(productOverlay);
    }
    

    await browser.close();
}

async function scrapeProductData(productOverlay) {
    const productData = await productOverlay.evaluate(element => {
    let title = element.querySelector('.ids-modal-base__title')?.textContent?.trim() || null; /* change if later if we have only one variant for more detailed title */
    const image = element.querySelector('.innerImageContainer.image img')?.src || null;
    const priceText = element.querySelector('.price-splash__text__firstValue')?.textContent?.trim() || null;
    const centsText = element.querySelector('.price-splash__text__secondaryValue')?.textContent?.trim() || null;

    let priceCents = null;

    if (priceText) {
        // Combine crowns and cents into a single integer (e.g., 29 kr + 90 öre = 2990)
        const crowns = parseInt(priceText.replace(/\D/g, '')) || 0;
        const cents = parseInt(centsText?.replace(/\D/g, '') || '0');
        priceCents = crowns * 100 + cents;
    }


    const unit = element.querySelector('.price-splash__text__suffix')?.textContent?.trim() || null;
    const deal =  element.querySelector('.price-splash__text__prefix')?.textContent?.trim() || null;
    const detailDivs = element.querySelectorAll('.detailsContainerInner > div');
    const isMember = element.querySelector('.price-splash__icon.price-splash__icon--stammis') ? true : false;

    let size = null;
    let brand = null;
    let comparisonPrice = null;
    let moreInfo = null;

    detailDivs.forEach(div => {
    const label = div.querySelector('.label')?.textContent?.trim();
    const text = div.querySelector('.text')?.textContent?.trim();

    if (!label || !text) return;

    if (label.includes('Vikt/Volym')) {
        size = text;
    } else if (label.includes('Leverantör/Land')) {
        brand = text;
    } else if (label.includes('Jmfpris')) {
        comparisonPrice = text ;
    } else if (label.includes('Mer information')) {
        moreInfo = text;
    }
    });
    
    let variants = null;
    const variantElements = element.querySelectorAll('.articleList .articleListItem__item');

    if (variantElements.length > 1) {
        variants = Array.from(variantElements).map(li => {
            const name = li.querySelector('.articleTitle')?.textContent?.trim() || null;
            const picture = li.querySelector('.articleImage')?.getAttribute('src') || null;
            return { name, picture };
        });
    }
   
    return {
      title,
      priceCents,
      unit,
      deal,
      size,
      brand,
      moreInfo,
      comparisonPrice,
      image,
      isMember,
      variants
    };
  });
  
    pushProductsToJson(productData);
    return productData;
}

let products = [];

async function pushProductsToJson(productData) {
    products.push(productData);
  
    // Save to JSON file
    fs.writeFileSync('ica.json', JSON.stringify(products, null, 2));

}

getProducts();