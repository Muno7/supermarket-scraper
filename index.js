import puppeteer from 'puppeteer';

async function getHTML() {
    const browser = await puppeteer.launch({
    headless: false // Opens visible browser
    });

    const page = await browser.newPage();
    await page.goto('https://www.coop.se/butiker-erbjudanden/coop/coop-skurup/');

    await page.evaluate(() => {
        const buttons = document.querySelectorAll('div.Rnj2piQi button.Wy2NiM6K.tkw4k9hc.dIzgXmHF');
        buttons.forEach(button => button.click());
    });

    await page.waitForSelector('div.ProductTeaser');

    const productTeasers = await page.$$('div.ProductTeaser');

    console.log(productTeasers, productTeasers.length);

    await browser.close();
}

getHTML();