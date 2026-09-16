import { devices, type PlaywrightTestConfig } from '@playwright/test';

export const browserUse = {
  locale: 'de-DE',
  timezoneId: 'Europe/Berlin',
  trace: 'retain-on-failure',
  screenshot: 'only-on-failure',
  video: 'off',
} satisfies PlaywrightTestConfig['use'];

export const chromiumProjects = [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
] satisfies PlaywrightTestConfig['projects'];
