import { promises as fs } from 'node:fs';
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const OVERLAY_ID = '__qa_bug_evidence_overlay__';
const DEFAULT_PADDING = 4;
const MAX_SLUG_LENGTH = 80;

export function buildOverlayStyle(
  box: BoundingBox,
  color = 'red',
  thickness = 4,
  padding = DEFAULT_PADDING,
): string {
  const top = Math.max(box.y - padding, 0);
  const left = Math.max(box.x - padding, 0);
  const width = box.width + padding * 2;
  const height = box.height + padding * 2;
  return [
    'position:fixed',
    `top:${top}px`,
    `left:${left}px`,
    `width:${width}px`,
    `height:${height}px`,
    `border:${thickness}px solid ${color}`,
    'box-sizing:border-box',
    'border-radius:4px',
    'pointer-events:none',
    'z-index:2147483647',
  ].join(';');
}

export function evidenceFileName(testTitle: string, suffix = ''): string {
  const slug = testTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').toLowerCase();
  const parts = [slug, suffix, timestamp].filter(Boolean);
  return `${parts.join('-')}.png`;
}

async function drawOverlay(page: Page, box: BoundingBox): Promise<void> {
  const style = buildOverlayStyle(box);
  await page.evaluate(
    ({ id, overlayStyle }) => {
      const existing = document.getElementById(id);
      if (existing) existing.remove();
      const div = document.createElement('div');
      div.id = id;
      div.setAttribute('style', overlayStyle);
      document.body.appendChild(div);
    },
    { id: OVERLAY_ID, overlayStyle: style },
  );
}

async function removeOverlay(page: Page): Promise<void> {
  await page
    .evaluate((id) => {
      const existing = document.getElementById(id);
      if (existing) existing.remove();
    }, OVERLAY_ID)
    .catch(() => {});
}

export async function captureFailureEvidence(
  page: Page,
  testInfo: TestInfo,
  locator?: Locator,
): Promise<void> {
  try {
    if (locator) {
      const box = await locator.boundingBox().catch(() => null);
      if (box) {
        await locator.scrollIntoViewIfNeeded().catch(() => {});
        await drawOverlay(page, box);
      }
    }
    const filePath = testInfo.outputPath(evidenceFileName(testInfo.title));
    const buffer = await page.screenshot();
    await fs.writeFile(filePath, buffer);
    await testInfo.attach('bug-evidence', { path: filePath, contentType: 'image/png' });
  } finally {
    await removeOverlay(page);
  }
}

export async function expectVisible(locator: Locator, options?: { timeout?: number }): Promise<void> {
  try {
    await expect(locator).toBeVisible(options);
  } catch (error) {
    await captureFailureEvidence(locator.page(), test.info(), locator);
    throw error;
  }
}
