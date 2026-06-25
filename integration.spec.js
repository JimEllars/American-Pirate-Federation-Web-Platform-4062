import { test, expect } from '@playwright/test';

// Function to generate the same checksum logic used in the app
async function generateChecksum(payloadString) {
  let checksum = '';
  // Fallback to simple hash for testing consistency if crypto isn't used
  let hash = 0;
  for (let i = 0; i < payloadString.length; i++) {
    const char = payloadString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

test('Recipe 1: Cryptographic Tamper Test', async ({ page }) => {
  page.on('pageerror', exception => {
    console.log(`[FATAL BROWSER EXCEPTION]: ${exception.message}`);
  });
  page.on('console', msg => console.log(`[BROWSER LOG]: ${msg.text()}`));

  await page.goto('http://localhost:5173');

  // Wait for app to be ready
  await page.waitForSelector('nav');

  // Inject a valid payload to localStorage
  await page.evaluate(async () => {
    const payload = { test: "data" };
    const payloadString = JSON.stringify(payload);

    // We can use the window.crypto if available, or just the fallback.
    // For simplicity, we just trigger the app to generate a queue item if possible,
    // but the prompt says: "Trigger an action that writes an entry to the apf_telemetry_queue inside localStorage."
    // Let's actually inject it by triggering the app's generateChecksum if it's exposed,
    // or just write it ourselves using the fallback logic which the app will use if crypto isn't present in headless.
    // Wait, the app will use crypto if available.
  });

  // Since we can't easily access the app's internal generateChecksum function,
  // we can mock the entire localStorage item, and use the simple checksum fallback that the app also uses
  // when crypto.subtle is not available. However, in Playwright, crypto.subtle IS available.

  await page.evaluate(async () => {
    // Generate actual hash using crypto
    const payload = { test: "valid_data" };
    const payloadString = JSON.stringify(payload);
    const encoder = new TextEncoder();
    const data = encoder.encode(payloadString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const item = {
      id: "test-id",
      url: "https://mock.supabase.co/functions/v1/telemetry-ingress",
      payload: payload,
      stagedAt: Date.now(),
      integrityHash: checksum
    };

    // 3. Manually edit that stringified JSON payload inside the DevTools Application Tab
    // alter a single character of the payload text while keeping the integrityHash identical.
    item.payload = { test: "invalid_data" }; // Tampered!

    localStorage.setItem('apf_telemetry_queue', JSON.stringify([item]));
  });

  // Wait a bit
  await page.waitForTimeout(1000);

  // Toggle offline/online
  await page.evaluate(() => {
    window.dispatchEvent(new Event('offline'));
    setTimeout(() => {
       window.dispatchEvent(new Event('online'));
    }, 500);
  });

  // Verify toast appears
  const toast = page.locator('text=[ SECURITY EXCEPTION: CORRUPTED OFFLINE PAYLOAD DROP ENFORCED ]');
  await expect(toast).toBeVisible({ timeout: 5000 });

  // Verify item is purged
  const queueSize = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem('apf_telemetry_queue') || '[]').length;
  });
  expect(queueSize).toBe(0);
});

test('Recipe 2: Stale Signature Burn Test', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Wait for app to be ready
  await page.waitForSelector('nav');

  await page.evaluate(async () => {
    const payload = { test: "stale_data" };
    const payloadString = JSON.stringify(payload);
    const encoder = new TextEncoder();
    const data = encoder.encode(payloadString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const item = {
      id: "stale-id",
      url: "https://mock.supabase.co/functions/v1/telemetry-ingress",
      payload: payload,
      stagedAt: Date.now() - (2.5 * 60 * 60 * 1000), // 2.5 hours ago
      integrityHash: checksum
    };

    localStorage.setItem('apf_telemetry_queue', JSON.stringify([item]));
  });

  await page.waitForTimeout(1000);

  // Toggle offline/online
  await page.evaluate(() => {
    window.dispatchEvent(new Event('offline'));
    setTimeout(() => {
       window.dispatchEvent(new Event('online'));
    }, 500);
  });

  // Verify toast appears
  const toast = page.locator('text=[ TRANSACTION EXPIRED: SIGNATURE AGE EXCEEDED 2-HOUR MAX BOUNDS ]');
  await expect(toast).toBeVisible({ timeout: 5000 });

  // Verify item is purged
  const queueSize = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem('apf_telemetry_queue') || '[]').length;
  });
  expect(queueSize).toBe(0);
});
