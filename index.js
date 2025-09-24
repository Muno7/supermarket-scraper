import puppeteer from 'puppeteer';

// Create a delay using a Promise
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getHTML() {
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

    const productTeasers = await page.$$('div.ProductTeaser');

    console.log(productTeasers, productTeasers.length);

    await browser.close();
}

getHTML();