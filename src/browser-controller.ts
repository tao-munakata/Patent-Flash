import { chromium, Browser, BrowserContext } from 'playwright';
import type { SearchResponse } from './types';
import type { SiteAdapter } from './adapters/base-adapter';

const RETRY_POLICY = {
  maxAttempts: 2 as number,
  delayMs: 2_000 as number,
  backoffRate: 1.5 as number,
};

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function launchBrowser(): Promise<{ browser: Browser; context: BrowserContext }> {
  const browser = await chromium.launch({
    headless: true,
    slowMo: 80,
    args: [
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--lang=ja-JP',
    ],
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 PatChatWrapper/1.0',
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
    viewport: { width: 1280, height: 900 },
  });

  return { browser, context };
}

export async function runSearch(
  adapter: SiteAdapter,
  query: string,
  mode: 'count_only' | 'count_and_list',
  maxResults: number
): Promise<SearchResponse> {
  let lastError: unknown;
  let delayMs = RETRY_POLICY.delayMs;

  for (let attempt = 1; attempt <= RETRY_POLICY.maxAttempts; attempt++) {
    let browser: Browser | undefined;
    try {
      const { browser: b, context } = await launchBrowser();
      browser = b;
      const page = await context.newPage();

      const result = await adapter.search(page, query, mode, maxResults);

      await browser.close();
      return result;
    } catch (err) {
      lastError = err;
      if (browser) await browser.close().catch(() => {});

      if (attempt < RETRY_POLICY.maxAttempts) {
        await sleep(delayMs);
        delayMs = Math.round(delayMs * RETRY_POLICY.backoffRate);
      }
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError);
  return {
    status: 'error',
    site: 'jplatpat',
    hitCount: 0,
    cached: false,
    error: `${RETRY_POLICY.maxAttempts}回リトライ後も失敗: ${message}`,
  };
}
