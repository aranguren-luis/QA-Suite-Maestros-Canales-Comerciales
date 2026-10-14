import { test, expect } from 'bun:test';
import config from './playwright.config';

test('playwright.config lee baseURL desde BASE_URL y apunta a la carpeta de tests correcta', () => {
  expect(config.use?.baseURL).toBe(process.env.BASE_URL);
  expect(config.testDir).toBe('../tests');
});

test('playwright.config define un timeout razonable (no infinito, no demasiado corto)', () => {
  expect(config.timeout).toBeGreaterThanOrEqual(10_000);
  expect(config.timeout).toBeLessThanOrEqual(60_000);
});
