import { chromium } from 'playwright';

async function run() {
  const url = process.env.URL || 'http://localhost:5174/secret-dashboard';
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const viewports = [ { name: 'desktop', width: 1280, height: 800 }, { name: 'tablet', width: 768, height: 1024 }, { name: 'mobile', width: 390, height: 844 } ];
  for (const v of viewports) {
    const page = await context.newPage({ viewport: { width: v.width, height: v.height } });
    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.screenshot({ path: `ui-${v.name}.png`, fullPage: true });
      console.log(`Saved ui-${v.name}.png`);
    } catch (err) {
      console.error('Error capturing', v.name, err.message);
    } finally {
      await page.close();
    }
  }
  await browser.close();
}

run().catch(e => { console.error(e); process.exit(1); });
