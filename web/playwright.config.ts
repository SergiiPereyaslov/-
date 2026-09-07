import { defineConfig, devices } from '@playwright/test';

/**
 * E2E проганяються проти продакшн-збірки, а не dev-сервера: частина дефектів,
 * які ми ловили (RSC-навігація, редиректи, статичні сторінки), у dev не
 * відтворюється.
 */
const PORT = Number(process.env.E2E_PORT ?? 3300);

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
    /**
     * Зазвичай браузер ставить `npx playwright install`. Якщо в оточенні вже
     * є готовий Chromium (CI-образ, пісочниця), вкажіть шлях до нього
     * у PLAYWRIGHT_CHROMIUM_PATH — тоді завантаження не потрібне.
     */
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : undefined,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
