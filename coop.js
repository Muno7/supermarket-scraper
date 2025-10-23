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

    const productElements = await page.$$('article.ohKiwh8z.xSu5Uapq');

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
    const title = element.querySelector('.OXTlHT32')?.textContent?.trim() || null;
    const price = element.querySelector('.slH8Imgo span:nth-last-child(2)')?.textContent?.trim() || Array.from(element.querySelector('.n1OznkM1')?.childNodes).filter(node => node.nodeType === Node.TEXT_NODE)[0]?.textContent?.trim() || null;
    const unit = element.querySelector('.Oam2mkaA :nth-of-type(2)')?.textContent?.trim() || null;
    const deal =
        element.querySelector('.slH8Imgo')?.querySelector('.u-textMedium')
            ? element.querySelector('.slH8Imgo :nth-of-type(1)')?.textContent?.trim()
            : element.querySelector('.n1OznkM1')?.querySelector('.u-textMedium')
            ? element.querySelector('.n1OznkM1 :nth-of-type(1)')?.textContent?.trim()
            : null;
    const size = (() => {
        const span = element.querySelector('.uLmN8HjX span:nth-last-child(1)');
        return span && !span.classList.contains('q5vMS42j') && span.classList.length === 0
            ? span.textContent.trim()
            : null;
    })();
    const brand =  element.querySelector('.q5vMS42j')?.textContent?.trim() || null;
    const max = element.querySelector('.UWFn16pY div.u-colorRed1')?.textContent?.trim() || null;
    const comparisonPrice = element.querySelector('.UWFn16pY div:nth-last-child(1)')?.textContent?.trim() || null;
    const image = element.querySelector('.q_ToRdGh.FJbxCHJa img')?.src || null;
    const isMember = element.querySelector('.aP5TkjG6.Er3da50N') ? true : false;
    const badges = Array.from(element.querySelectorAll('.VFIPn1KI img')).map(img => img.src) || null;
    const hasVariants = element.querySelector('.Wy2NiM6K.iyTkejCQ._yrJb637.mOvy16Ff') !== null
        
    return {
      title,
      price,
      unit,
      deal,
      size,
      brand,
      max,
      comparisonPrice,
      image,
      isMember,
      badges,
      hasVariants
    };
  });
  

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
    fs.writeFileSync('coop.json', JSON.stringify(products, null, 2));

}

getProducts();