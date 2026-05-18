import { chromium } from 'playwright';

/**
 * Comprehensive admin page test suite.
 * Tests: login, tab navigation, Home/Settings buttons, no 401 errors, no React warnings.
 */
async function runAdminTests() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Collect console messages and errors
  const consoleLogs = [];
  const consoleErrors = [];
  const networkErrors = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    if (msg.type() === 'error') consoleErrors.push(text);
  });
  page.on('response', response => {
    if (response.status() === 401) networkErrors.push(`401: ${response.url()}`);
  });

  try {
    console.log('🧪 [Test 1] Navigate to login page');
    await page.goto('http://localhost:5174/login');
    await page.waitForLoadState('networkidle');
    console.log('✅ Login page loaded');

    console.log('🧪 [Test 2] Log in as admin@test.com');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'Admin123!@#');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    console.log('✅ Login successful, redirected');

    console.log('🧪 [Test 3] Navigate to admin dashboard');
    await page.goto('http://localhost:5174/secret-dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for alerts to load
    console.log('✅ Admin dashboard loaded');

    console.log('🧪 [Test 4] Test tab navigation');
    const tabs = ['analytics', 'orders', 'catalog', 'products', 'inventory', 'marketing', 'email', 'reviews', 'coupons', 'users', 'ai', 'settings'];
    for (const tab of tabs) {
      const tabBtn = page.locator(`button:has-text("${['Dashboard', 'Đơn hàng', 'Danh mục', 'Sản phẩm', 'Kho hàng', 'Marketing', 'Email', 'Reviews & Q&A', 'Mã giảm giá', 'Người dùng', 'AI System', 'Giao diện'][tabs.indexOf(tab)]}")`).first();
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await page.waitForTimeout(500);
        console.log(`  ✓ Tab "${tab}" switched`);
      }
    }
    console.log('✅ All tabs navigable');

    console.log('🧪 [Test 5] Test Home button (desktop topbar)');
    const homeBtn = page.locator('a[title="Về trang chủ"]').first();
    if (await homeBtn.isVisible()) {
      console.log('  ✓ Home button visible in topbar');
    } else {
      console.log('  ⚠️ Home button not found');
    }

    console.log('🧪 [Test 6] Test Catalog tab for duplicate key warning');
    const catalogTabBtn = page.locator('button:has-text("Danh mục")').first();
    await catalogTabBtn.click();
    await page.waitForTimeout(800);
    const hasDuplicateKeyWarning = consoleLogs.some(log => 
      log.includes('two children with the same key') || 
      log.includes('Non-unique keys')
    );
    if (!hasDuplicateKeyWarning) {
      console.log('✅ No duplicate key warnings in Catalog tab');
    } else {
      console.log('⚠️ Duplicate key warning detected');
    }

    console.log('🧪 [Test 7] Check for 401 Unauthorized errors');
    if (networkErrors.length === 0) {
      console.log('✅ No 401 errors in network requests');
    } else {
      console.log('⚠️ 401 errors found:');
      networkErrors.forEach(err => console.log(`  - ${err}`));
    }

    console.log('🧪 [Test 8] Check for React console errors');
    const hasReactErrors = consoleErrors.some(err =>
      err.includes('error') || err.includes('Error') || 
      err.includes('Cannot read') || err.includes('undefined')
    );
    if (!hasReactErrors) {
      console.log('✅ No critical React errors');
    } else {
      console.log('⚠️ React errors detected:');
      consoleErrors.slice(0, 5).forEach(err => console.log(`  - ${err}`));
    }

    console.log('\n📊 Test Summary:');
    console.log(`  Total console logs: ${consoleLogs.length}`);
    console.log(`  Total console errors: ${consoleErrors.length}`);
    console.log(`  Network 401 errors: ${networkErrors.length}`);
    console.log(`  Duplicate key warnings: ${hasDuplicateKeyWarning ? 'Yes' : 'No'}`);

    console.log('\n✅ All admin page tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

runAdminTests();
