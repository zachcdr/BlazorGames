import { defineConfig } from '@playwright/test';

const PORT = 5179;

export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  },
  projects: [{ name: 'phone', use: { browserName: 'chromium' } }],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
  },
});
