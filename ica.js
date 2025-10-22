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
        console.log(productOverlay)
        await scrapeProductData(productOverlay, false);
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

async function scrapeProductData(productOverlay, isVariant) {
    const productData = await productOverlay.evaluate(element => {
    const title = element.querySelector('.ids-modal-base__title')?.textContent?.trim() || null;
    const price = element.querySelector('.price-splash__text__firstValue')?.textContent?.trim() || null;
    const cents = element.querySelector('.price-splash__text__secondaryValue')?.textContent?.trim() || null;
    const unit = element.querySelector('.price-splash__text__suffix')?.textContent?.trim() || null;
    const deal =  element.querySelector('.price-splash__text__prefix')?.textContent?.trim() || null;
    const detailDivs = element.querySelectorAll('.detailsContainerInner > div');

    let size = null;
    let brand = null;
    let comparisonPrice = null;

    detailDivs.forEach(div => {
    const label = div.querySelector('.label')?.textContent?.trim();
    const text = div.querySelector('.text')?.textContent?.trim();

    if (!label || !text) return;

    if (label.includes('Vikt/Volym')) {
        size = text;
    } else if (label.includes('Leverantör/Land')) {
        brand = text;
    } else if (label.includes('Jmfpris')) {
        comparisonPrice = text;
    }
    });
    
    const image = element.querySelector('.innerImageContainer.image img')?.src || null;
    const isMember = element.querySelector('.price-splash__icon.price-splash__icon--stammis') ? true : false;        
   
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
    };
  });
  
    // if the product has variants and itself is not variant of another product then scrape the variants of that product
    pushProductsToJson(productData);


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