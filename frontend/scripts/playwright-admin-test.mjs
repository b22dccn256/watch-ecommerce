import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const devSessionUrl = 'http://localhost:5002/api/__dev/set-session?email=admin@watchstore.com';
  console.log('Visiting dev session URL to set cookies...');
  await page.goto(devSessionUrl);
  await page.waitForTimeout(300);

  console.log('Navigating to admin page...');
  const t0 = Date.now();
  await page.goto('http://localhost:5174/admin?tab=products', { waitUntil: 'networkidle' });
  console.log('Admin page loaded in', Date.now() - t0, 'ms');

  // wait for products table
  await page.waitForSelector('button[title="Chỉnh sửa sản phẩm"]', { timeout: 10000 });

  // click first edit button and measure time to modal header
  const editBtn = await page.$('button[title="Chỉnh sửa sản phẩm"]');
  const tClick = Date.now();
  await editBtn.click();

  // wait for modal title
  try {
    await page.waitForSelector('h2:text("Chỉnh Sửa Sản Phẩm")', { timeout: 20000 });
  } catch (e) {
    // fallback: wait for any modal h2
    await page.waitForSelector('div[role="dialog"] h2, .fixed h2', { timeout: 20000 });
  }
  const elapsed = Date.now() - tClick;
  console.log('Time from click to modal shown:', elapsed, 'ms');

  // capture console logs
  const logs = [];
  page.on('console', msg => logs.push({ type: msg.type(), text: msg.text() }));

  // wait a bit then print logs
  await page.waitForTimeout(500);
  console.log('Captured console logs (tail):');
  const tail = logs.slice(-20);
  tail.forEach(l => console.log(l.type, l.text));

  await browser.close();
  process.exit(0);
})();
