import { describe, test, expect } from 'bun:test';
import { buildOverlayStyle, evidenceFileName } from './evidence';

describe('buildOverlayStyle', () => {
  test('positions the overlay around the bounding box with default padding', () => {
    const style = buildOverlayStyle({ x: 10, y: 20, width: 100, height: 50 });
    expect(style).toContain('position:fixed');
    expect(style).toContain('top:16px');
    expect(style).toContain('left:6px');
    expect(style).toContain('width:108px');
    expect(style).toContain('height:58px');
    expect(style).toContain('border:4px solid red');
  });

  test('clamps top/left to 0 when the element is near the viewport edge', () => {
    const style = buildOverlayStyle({ x: 2, y: 1, width: 40, height: 20 });
    expect(style).toContain('top:0px');
    expect(style).toContain('left:0px');
  });

  test('accepts a custom color and thickness', () => {
    const style = buildOverlayStyle({ x: 0, y: 0, width: 10, height: 10 }, 'lime', 2);
    expect(style).toContain('border:2px solid lime');
  });

  test('sits above any page content via a max z-index', () => {
    const style = buildOverlayStyle({ x: 0, y: 0, width: 10, height: 10 });
    expect(style).toContain('z-index:2147483647');
  });
});

describe('evidenceFileName', () => {
  test('slugifies the test title into a lowercase, dash-separated name', () => {
    const name = evidenceFileName('TC-AG-001 - Navigate to Affinity Groups!');
    expect(name).toMatch(/^tc-ag-001-navigate-to-affinity-groups-\d{4}-\d{2}-\d{2}t/);
    expect(name.endsWith('.png')).toBe(true);
  });

  test('includes an ISO-like timestamp with no colons (filesystem-safe)', () => {
    const name = evidenceFileName('some test');
    expect(name).not.toContain(':');
  });

  test('truncates very long titles to 80 characters before the timestamp', () => {
    const longTitle = 'a'.repeat(200);
    const name = evidenceFileName(longTitle);
    const slugPart = name.split(/-\d{4}-\d{2}-\d{2}t/)[0];
    expect(slugPart.length).toBeLessThanOrEqual(80);
  });

  test('appends an optional suffix before the timestamp', () => {
    const name = evidenceFileName('My Test', 'retry1');
    expect(name).toContain('my-test-retry1-');
  });
});
