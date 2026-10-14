import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import { captureFailureEvidence, expectVisible } from './helpers/evidence';

const ADMIN_EMAIL = process.env.QA_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.QA_ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error('QA_ADMIN_EMAIL and QA_ADMIN_PASSWORD must be set — see .env.example');
}

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email *' }).fill(ADMIN_EMAIL);
  await page.getByRole('textbox', { name: '••••••••' }).fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/masters');
}

async function openChannelTypes(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Masters' }).click();
  await page.getByRole('listitem').filter({ hasText: /^Channels & Acquisition/ }).click();
  await page.getByRole('link', { name: 'Channel Types' }).click();
  await page.waitForURL('**/masters/channel-types');
}

async function getEffectiveContrastRatio(locator: import('@playwright/test').Locator): Promise<number> {
  return locator.evaluate((el) => {
    const toSrgbPixel = (colorValue: string): [number, number, number, number] => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const context = canvas.getContext('2d');
      if (!context) return [0, 0, 0, 0];
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = colorValue;
      context.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
      return [r, g, b, a];
    };
    const toLinearChannel = (channel: number): number => {
      const srgb = channel / 255;
      return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
    };
    const relativeLuminance = ([r, g, b]: [number, number, number]): number =>
      0.2126 * toLinearChannel(r) + 0.7152 * toLinearChannel(g) + 0.0722 * toLinearChannel(b);

    const [textR, textG, textB] = toSrgbPixel(getComputedStyle(el).color);

    let node: Element | null = el;
    let backgroundColor: [number, number, number] = [255, 255, 255];
    while (node) {
      const [r, g, b, a] = toSrgbPixel(getComputedStyle(node).backgroundColor);
      if (a > 0) {
        backgroundColor = [r, g, b];
        break;
      }
      node = node.parentElement;
    }

    const textLuminance = relativeLuminance([textR, textG, textB]);
    const backgroundLuminance = relativeLuminance(backgroundColor);
    const lighter = Math.max(textLuminance, backgroundLuminance);
    const darker = Math.min(textLuminance, backgroundLuminance);
    return (lighter + 0.05) / (darker + 0.05);
  });
}

test.describe('Channel Types - UI (demo environment via BASE_URL, no real backend)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === testInfo.expectedStatus) return;
    const alreadyCaptured = testInfo.attachments.some((a) => a.name === 'bug-evidence');
    if (alreadyCaptured) return;
    await captureFailureEvidence(page, testInfo);
  });

  test('TC-CHT-001 - Navigate to the Channel Types master', async ({ page }) => {
    await openChannelTypes(page);
    await expectVisible(page.getByRole('heading', { name: 'Channel Types' }));
    await expectVisible(page.getByRole('button', { name: 'New Channel Type' }));
    await expectVisible(page.getByRole('link', { name: 'Approval Requests' }));
    await expect(page.locator('table tbody tr')).not.toHaveCount(0);
  });

  test('TC-CHT-002 - The Approval Requests tab shows a badge that reflects the real pending count', async ({ page }) => {
    await openChannelTypes(page);
    await expectVisible(page.getByRole('link', { name: 'Approval Requests 1' }));

    await page.getByRole('row', { name: /Propios/ }).getByRole('button', { name: 'Deactivate' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-CHT-002');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();

    await expectVisible(page.getByRole('link', { name: 'Approval Requests 2' }));
  });

  test('TC-CHT-003 - Switch between the list and Approval Requests tabs', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await openChannelTypes(page);
    const channelTypesTab = page.locator('a').filter({ hasText: /^Channel Types$/ });
    const approvalRequestsTab = page.getByRole('link', { name: 'Approval Requests' });

    await expect(channelTypesTab).toHaveAttribute('aria-current', 'page');
    await expect(approvalRequestsTab).not.toHaveAttribute('aria-current', 'page');

    await approvalRequestsTab.click();
    await page.waitForURL('**/masters/channel-types/requests');
    await expectVisible(page.getByRole('button', { name: 'Approve' }).first());
    await expect(approvalRequestsTab).toHaveAttribute('aria-current', 'page');
    await expect(channelTypesTab).not.toHaveAttribute('aria-current', 'page');

    await channelTypesTab.click();
    await page.waitForURL('**/masters/channel-types');
    await expectVisible(page.getByRole('table'));
    await expect(channelTypesTab).toHaveAttribute('aria-current', 'page');
    await expect(approvalRequestsTab).not.toHaveAttribute('aria-current', 'page');

    expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
    expect(pageErrors, pageErrors.join('\n')).toEqual([]);
  });

  test("TC-CHT-004 - 'New Channel Type' opens the create dialog; row Edit opens the edit dialog", async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('button', { name: 'New Channel Type' }).click();
    const createDialog = page.getByRole('dialog');
    await expectVisible(createDialog.getByRole('heading', { name: 'New Channel Type' }));
    await createDialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.getByRole('row', { name: /Propios/ }).getByLabel('Edit').click();
    const editDialog = page.getByRole('dialog');
    await expectVisible(editDialog.getByRole('heading', { name: 'Edit Channel Type' }));
    await expectVisible(editDialog.getByRole('textbox', { name: 'Name *' }));
    await expect(editDialog.getByRole('textbox', { name: 'Name *' })).toHaveValue('Propios');
    await editDialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('TC-CHT-005 - The list shows all expected columns', async ({ page }) => {
    await openChannelTypes(page);
    for (const col of ['Channel type', 'Code', 'Management nature', 'Partners', 'Approval', 'Status', 'Last updated']) {
      await expectVisible(page.getByRole('columnheader', { name: col }));
    }
  });

  test('TC-CHT-006 - The Partners count is a link for every row; clicking it navigates to Channel Partners', async ({ page }) => {
    await openChannelTypes(page);
    const rows = page.locator('table tbody tr');
    await expectVisible(rows.first());
    await expect(rows).toHaveCount(4);

    for (let i = 0; i < 4; i += 1) {
      const partnersLink = rows.nth(i).getByRole('link');
      await expectVisible(partnersLink);
      await expect(partnersLink).toHaveText(/\d/);
    }

    await rows.first().getByRole('link').click();
    await page.waitForURL('**/masters/channel-partners');
    await expectVisible(page.getByRole('heading', { name: 'Channel Partners' }));
  });

  test('TC-CHT-007 - Management nature badge (Internal / Third-party)', async ({ page }) => {
    await openChannelTypes(page);
    await expectVisible(page.getByRole('row', { name: /Propios/ }).getByText('Internal'));
    await expectVisible(page.getByRole('row', { name: /Aliados Integrales/ }).getByText('Third-party'));
  });

  test('TC-CHT-008 - The Approval column shows a pending indicator or a dash', async ({ page }) => {
    await openChannelTypes(page);
    const pendingBadge = page.getByRole('row', { name: /Desarrollos/ }).getByText('Pending');
    await expectVisible(pendingBadge);
    await expectVisible(page.getByRole('row', { name: /Propios/ }).getByText('-', { exact: true }));
    await expect(page.getByRole('row', { name: /Desarrollos/ }).getByRole('button', { name: 'Edit' })).toBeDisabled();

    await pendingBadge.hover();
    const tooltip = page.getByRole('tooltip');
    await expectVisible(tooltip);
    await expect(tooltip).toHaveText('Active → Inactive');
  });

  test('TC-CHT-009 - Export and toggle columns', async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('button', { name: 'Columns' }).click();
    await expectVisible(page.getByRole('checkbox', { name: 'Channel type' }));
    await expect(page.getByRole('checkbox', { name: 'Channel type' })).toBeDisabled();

    await page.getByRole('checkbox', { name: 'Partners' }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('columnheader', { name: 'Partners' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Columns' }).click();
    await page.getByRole('checkbox', { name: 'Partners' }).click();
    await page.keyboard.press('Escape');
    await expectVisible(page.getByRole('columnheader', { name: 'Partners' }));

    await expectVisible(page.getByRole('button', { name: 'Export' }));
    await page.getByRole('button', { name: 'Export' }).click();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('menuitem', { name: 'CSV (.csv)' }).click(),
    ]);
    expect(download.suggestedFilename()).toContain('channel-types');

    const csvPath = join(tmpdir(), download.suggestedFilename());
    await download.saveAs(csvPath);
    const csvContent = await readFile(csvPath, 'utf-8');
    for (const header of ['Channel type', 'Code', 'Management nature', 'Partners', 'Status']) {
      expect(csvContent).toContain(header);
    }
  });

  test('TC-CHT-010 - Create a valid Channel Type - it waits for approval', async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('button', { name: 'New Channel Type' }).click();
    const createDialog = page.getByRole('dialog');
    await createDialog.getByRole('textbox', { name: 'Name *' }).fill('Retail Chain QA010');
    await createDialog.getByRole('textbox', { name: 'Code *' }).fill('retail_chain_qa010');
    await createDialog.getByRole('button', { name: 'Submit for Approval' }).click();

    await expectVisible(page.getByText('Submitted for approval.'));
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('row', { name: /Retail Chain QA010/ })).toHaveCount(0);

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/masters/channel-types/requests');
    const requestCard = page
      .locator('[data-slot="card"]')
      .filter({ hasText: 'Retail Chain QA010 · RETAIL_CHAIN_QA010' });
    await expectVisible(requestCard);
    await expectVisible(requestCard.getByText('Create', { exact: true }));

    await requestCard.getByRole('button', { name: 'Approve' }).click();
    await expectVisible(page.getByRole('dialog').getByRole('button', { name: 'Approve' }));
    await page.getByRole('dialog').getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.locator('a').filter({ hasText: /^Channel Types$/ }).click();
    await page.waitForURL('**/masters/channel-types');
    await expectVisible(page.getByRole('row', { name: /Retail Chain QA010/ }), { timeout: 10000 });
  });

  test('TC-CHT-011 - Code is converted to uppercase (SCREAMING_SNAKE identifier)', async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('button', { name: 'New Channel Type' }).click();
    await page.getByRole('textbox', { name: 'Code *' }).fill('retail_chain_qa011');
    await expect(page.getByRole('textbox', { name: 'Code *' })).toHaveValue('RETAIL_CHAIN_QA011');
  });

  test('TC-CHT-012 - Management nature selection (Internal / Third-party)', async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('button', { name: 'New Channel Type' }).click();
    await page.getByRole('combobox', { name: 'Management nature *' }).click();
    await expectVisible(page.getByRole('option', { name: 'Internal' }));
    await expectVisible(page.getByRole('option', { name: 'Third-party' }));
    await page.getByRole('option', { name: 'Internal' }).click();
    await expect(page.getByRole('combobox', { name: 'Management nature *' })).toHaveText('Internal');
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();

    await page.getByRole('link', { name: 'Channel Partners' }).click();
    await page.waitForURL('**/masters/channel-partners');
    await page.getByRole('button', { name: 'New Partner' }).click();
    await page.waitForURL('**/masters/channel-partners/new');

    const channelTypeCombobox = page.getByRole('combobox', { name: 'Channel type *' });
    await channelTypeCombobox.click();
    await expectVisible(page.getByRole('option', { name: 'Aliados Integrales' }));
    await expect(page.getByRole('option', { name: 'Propios', exact: true })).toHaveCount(0);
  });

  test("TC-CHT-013 - A new type appears in Approval Requests as a pending 'create' request", async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('button', { name: 'New Channel Type' }).click();
    await page.getByRole('textbox', { name: 'Name *' }).fill('Retail Chain QA013');
    await page.getByRole('textbox', { name: 'Code *' }).fill('RETAIL_CHAIN_QA013');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/channel-types');

    await expect(page.getByRole('row', { name: /Retail Chain QA013/ })).toHaveCount(0);

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await expectVisible(page.getByText('Retail Chain QA013 · RETAIL_CHAIN_QA013'));
    await expectVisible(page.getByText('Create', { exact: true }));
  });

  test('TC-CHT-014 - Name is required (2-128 characters)', async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('button', { name: 'New Channel Type' }).click();

    await page.getByRole('textbox', { name: 'Code *' }).fill('QA014');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expect(page.getByRole('textbox', { name: 'Name *' })).toHaveAttribute('aria-invalid', 'true');

    await page.getByRole('textbox', { name: 'Name *' }).fill('A');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expect(page.getByRole('textbox', { name: 'Name *' })).toHaveAttribute('aria-invalid', 'true');

    await page.getByRole('textbox', { name: 'Name *' }).fill('A'.repeat(129));
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expect(page.getByRole('textbox', { name: 'Name *' })).toHaveAttribute('aria-invalid', 'true');

    await page.getByRole('textbox', { name: 'Name *' }).fill('Retail Chain');
    await page.getByRole('textbox', { name: 'Code *' }).fill('QA014B');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expectVisible(page.getByText('Submitted for approval.'));
  });

  test('TC-CHT-015 - Code validation: required, uppercase, 2-64 chars, invalid chars rejected', async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('button', { name: 'New Channel Type' }).click();
    const code = page.getByRole('textbox', { name: 'Code *' });

    await page.getByRole('textbox', { name: 'Name *' }).fill('QA Retail 015');
    await code.fill('a');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expect(code).toHaveAttribute('aria-invalid', 'true');

    await code.fill('A'.repeat(65));
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expect(code).toHaveAttribute('aria-invalid', 'true');

    await code.fill('RETAIL@CHAIN');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expect(code).toHaveAttribute('aria-invalid', 'true');

    // Documented: typing spaces should be stripped automatically ('retail chain' -> 'RETAILCHAIN').
    // Confirmed bug (2026-10-06): spaces are kept, only the case is converted - see vault note
    // 2026-10-06-channel-types-code-no-elimina-espacios-y-editable-en-edicion.md
    await code.fill('retail chain qa015');
    await expect(code).toHaveValue('RETAILCHAINQA015');

    await code.fill('RETAIL_CHAIN_QA015');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expectVisible(page.getByText('Submitted for approval.'));
  });

  test('TC-CHT-015b - Code is locked/read-only when editing (documented, not enforced)', async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('row', { name: /Aliados Integrales/ }).getByLabel('Edit').click();
    // Documented: "Code can only be set on creation; it is locked/read-only on edit."
    // Confirmed bug (2026-10-06): the field is a normal editable textbox - see vault note
    // 2026-10-06-channel-types-code-no-elimina-espacios-y-editable-en-edicion.md
    await expect(page.getByRole('textbox', { name: 'Code *' })).toBeDisabled();
  });

  test('TC-CHT-016 - Duplicate code rejected', async ({ page }) => {
    await openChannelTypes(page);
    const propiosRows = page.locator('table tbody tr').filter({ hasText: 'PROPIOS' });
    await expect(propiosRows).toHaveCount(1);

    await page.getByRole('button', { name: 'New Channel Type' }).click();
    await page.getByRole('textbox', { name: 'Name *' }).fill('QA Duplicate 016');
    const code = page.getByRole('textbox', { name: 'Code *' });
    await code.fill('propios');
    await expect(code).toHaveValue('PROPIOS');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expectVisible(page.getByText('Channel type code PROPIOS already exists'));

    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
    await expect(propiosRows).toHaveCount(1);
  });

  test('TC-CHT-017 - Request reason is required when editing', async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('row', { name: /Aliados Integrales/ }).getByLabel('Edit').click();
    await page.getByRole('textbox', { name: 'Name *' }).fill('Aliados Integrales Plus');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expectVisible(page.getByText('A reason is required when editing a channel type.'));

    const dialog = page.getByRole('dialog');
    await expectVisible(dialog);
    await expectVisible(dialog.getByRole('textbox', { name: 'Name *' }));
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('row', { name: /Aliados Integrales/ }).getByText('Pending')).toHaveCount(0);
  });

  test('TC-CHT-018 - Editing leaves a pending change; the live record stays intact until approved', async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('row', { name: /Aliados Integrales/ }).getByLabel('Edit').click();
    await page.getByRole('textbox', { name: 'Name *' }).fill('Aliados Integrales Plus');
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-CHT-018');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();

    await expectVisible(page.getByRole('row', { name: /Aliados Integrales ALIADOS_INTEGRALES/ }));
    await expect(page.getByRole('row', { name: /Aliados Integrales Plus/ })).toHaveCount(0);
    await expectVisible(page.getByRole('row', { name: /Aliados Integrales/ }).getByText('Pending'));
    await expect(page.getByRole('row', { name: /Aliados Integrales/ }).getByRole('button', { name: 'Edit' })).toBeDisabled();
  });

  test('TC-CHT-019 - Deactivate / Activate leaves a pending status-change request', async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('row', { name: /Aliados Integrales/ }).getByRole('button', { name: 'Deactivate' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-CHT-019 deactivate');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();

    await expectVisible(page.getByRole('row', { name: /Aliados Integrales/ }).getByText('Active'));
    await expectVisible(page.getByRole('row', { name: /Aliados Integrales/ }).getByText('Pending'));

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.getByRole('button', { name: 'Approve' }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.locator('a').filter({ hasText: /^Channel Types$/ }).click();
    await expectVisible(page.getByRole('row', { name: /Aliados Integrales/ }).getByText('Inactive'));

    await page.getByRole('row', { name: /Aliados Integrales/ }).getByRole('button', { name: 'Activate' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-CHT-019 activate');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();

    await expectVisible(page.getByRole('row', { name: /Aliados Integrales/ }).getByText('Inactive'));
    await expectVisible(page.getByRole('row', { name: /Aliados Integrales/ }).getByText('Pending'));
  });

  test('TC-CHT-020 - Approve/reject a status-change request', async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('row', { name: /Aliados Integrales/ }).getByRole('button', { name: 'Deactivate' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-CHT-020 approve');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expect(page.getByRole('alertdialog')).toHaveCount(0, { timeout: 10000 });
    await expectVisible(page.getByRole('row', { name: /Aliados Integrales/ }).getByText('Pending'));
    await expect(page.getByText('Submitted for approval', { exact: true })).toBeHidden({ timeout: 10000 });

    await page.getByRole('row', { name: /Socios Estratégicos/ }).getByRole('button', { name: 'Deactivate' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-CHT-020 reject');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expect(page.getByRole('alertdialog')).toHaveCount(0, { timeout: 10000 });

    await page.getByRole('link', { name: 'Approval Requests' }).click();

    const approveCard = page
      .locator('[data-slot="card"]')
      .filter({ hasText: 'Aliados Integrales · ALIADOS_INTEGRALES' })
      .filter({ hasText: 'QA TC-CHT-020 approve' });
    await expectVisible(approveCard);
    await approveCard.getByRole('button', { name: 'Approve' }).click();
    await expectVisible(page.getByRole('dialog').getByRole('button', { name: 'Approve' }));
    await page.getByRole('dialog').getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    const rejectCard = page
      .locator('[data-slot="card"]')
      .filter({ hasText: 'Socios Estratégicos · SOCIOS_ESTRATEGICOS' })
      .filter({ hasText: 'QA TC-CHT-020 reject' });
    await expectVisible(rejectCard);
    await rejectCard.getByRole('button', { name: 'Reject' }).click();
    await page.getByRole('textbox', { name: 'Explain why this request' }).fill('QA TC-CHT-020 reject reason');
    await page.getByRole('dialog').getByRole('button', { name: 'Reject' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await expectVisible(rejectCard.getByText('Rejected', { exact: true }));
    await expect(rejectCard.getByRole('button', { name: 'Approve' })).toHaveCount(0);
    await expect(rejectCard.getByRole('button', { name: 'Reject' })).toHaveCount(0);

    await page.locator('a').filter({ hasText: /^Channel Types$/ }).click();
    await expectVisible(page.getByRole('row', { name: /Aliados Integrales/ }).getByText('Inactive'));
    await expectVisible(page.getByRole('row', { name: /Aliados Integrales/ }).getByRole('button', { name: 'Activate' }));
    await expectVisible(page.getByRole('row', { name: /Socios Estratégicos/ }).getByText('Active'));
    await expectVisible(page.getByRole('row', { name: /Socios Estratégicos/ }).getByRole('button', { name: 'Deactivate' }));
  });

  test('TC-CHT-021 - No Delete/Retire action exists for Channel Types (closed catalog)', async ({ page }) => {
    await openChannelTypes(page);
    const row = page.getByRole('row', { name: /Propios/ });
    await expectVisible(row.getByRole('button', { name: 'Edit' }));
    await expectVisible(row.getByRole('button', { name: 'Deactivate' }));
    await expect(row.getByRole('button', { name: 'Delete' })).toHaveCount(0);
    await expect(row.getByRole('button', { name: 'Retire' })).toHaveCount(0);
  });

  test('TC-CHT-022 - Approval Requests lists the full history (pending + approved + rejected)', async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('row', { name: /Propios/ }).getByRole('button', { name: 'Deactivate' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-CHT-022 approve');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expectVisible(page.getByText('Submitted for approval', { exact: true }));
    await expect(page.getByText('Submitted for approval', { exact: true })).toBeHidden({ timeout: 10000 });

    await page.getByRole('row', { name: /Socios Estratégicos/ }).getByRole('button', { name: 'Deactivate' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-CHT-022 reject');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expectVisible(page.getByText('Submitted for approval', { exact: true }));

    await page.getByRole('link', { name: 'Approval Requests' }).click();

    const approveCard = page.locator('[data-slot="card"]').filter({ hasText: 'QA TC-CHT-022 approve' });
    const rejectCard = page.locator('[data-slot="card"]').filter({ hasText: 'QA TC-CHT-022 reject' });

    await approveCard.getByRole('button', { name: 'Approve' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await rejectCard.getByRole('button', { name: 'Reject' }).click();
    await page.getByRole('textbox', { name: 'Explain why this request' }).fill('QA reject reason');
    await page.getByRole('dialog').getByRole('button', { name: 'Reject' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await expectVisible(approveCard.getByText('Approved', { exact: true }));
    await expectVisible(rejectCard.getByText('Rejected', { exact: true }));
    await expectVisible(page.getByText('Pending', { exact: true }).first());
  });

  test('TC-CHT-023 - Approve comment is optional; Reject comment is mandatory', async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('row', { name: /Propios/ }).getByRole('button', { name: 'Deactivate' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-CHT-023');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.getByRole('button', { name: 'Reject' }).first().click();
    await expect(page.getByRole('dialog').getByRole('button', { name: 'Reject' })).toBeDisabled();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();

    await page.getByRole('button', { name: 'Approve' }).first().click();
    await expectVisible(page.getByRole('dialog').getByRole('button', { name: 'Approve' }));
    await expect(page.getByRole('dialog').getByRole('button', { name: 'Approve' })).toBeEnabled();
  });

  test('TC-CHT-024 - Resolved requests persist in Approval Requests (audit trail)', async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('row', { name: /Propios/ }).getByRole('button', { name: 'Deactivate' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-CHT-024');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.getByRole('button', { name: 'Approve' }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    const card = page.locator('[data-slot="card"]').filter({ hasText: 'QA TC-CHT-024' });
    await expectVisible(card.getByText('Propios · PROPIOS'));
    await expectVisible(card.getByText('Approved', { exact: true }));
  });

  test('TC-CHT-025, TC-CHT-027 - No permission system or second user/role to test visibility/access rules (not reproducible; also "Under Development" per the vendor)', async ({ page }) => {
    await page.getByRole('button', { name: 'DU Demo User' }).click();
    await expectVisible(page.getByRole('menuitem', { name: 'Profile' }));
    await expect(page.getByRole('menuitem', { name: /permission|role|rol/i })).toHaveCount(0);
  });

  test('TC-CHT-026 - A pending request blocks Edit and Activate/Deactivate on that type', async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('row', { name: /Propios/ }).getByRole('button', { name: 'Deactivate' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-CHT-026');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();

    const row = page.getByRole('row', { name: /Propios/ });
    await expect(row.getByRole('button', { name: 'Edit' })).toBeDisabled();
    await expect(row.getByRole('button', { name: 'Deactivate' })).toBeDisabled();
  });

  test('TC-CHT-028 - Localization: labels, natures and statuses render in the active language', async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('button', { name: 'Change Language' }).click();
    await expectVisible(page.getByRole('heading', { name: 'Tipos de Canal' }));
    await expectVisible(page.getByRole('columnheader', { name: 'Código' }));
    await expectVisible(page.getByRole('row', { name: /Propios/ }).getByText('Propia'));
    await expectVisible(page.getByRole('row', { name: /Aliados Integrales/ }).getByText('Terceros'));
    await expect(page.getByText('validation.', { exact: false })).toHaveCount(0);
  });

  test('TC-CHT-029 - Sort the list by a sortable column (ascending / descending)', async ({ page }) => {
    await openChannelTypes(page);
    const firstCellBefore = await page.locator('table tbody tr').first().locator('td').nth(1).innerText();

    await page.getByRole('columnheader', { name: 'Channel type' }).getByRole('button').click();
    const firstCellAsc = await page.locator('table tbody tr').first().locator('td').nth(1).innerText();
    expect(firstCellAsc).toBe('Aliados Integrales');

    await page.getByRole('columnheader', { name: 'Channel type' }).getByRole('button').click();
    const firstCellDesc = await page.locator('table tbody tr').first().locator('td').nth(1).innerText();
    expect(firstCellDesc).toBe('Socios Estratégicos');
    expect(firstCellBefore).not.toBe(firstCellDesc);
  });

  test("TC-CHT-030 - The 'Last updated' column is not sortable", async ({ page }) => {
    await openChannelTypes(page);
    await expect(page.getByRole('columnheader', { name: 'Last updated' }).getByRole('button')).toHaveCount(0);
  });

  test("TC-CHT-031 - 'Request reason' is disabled by default when editing and enables only after a real change", async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('row', { name: /Propios/ }).getByLabel('Edit').click();
    const dialog = page.getByRole('dialog');
    const reason = dialog.getByRole('textbox', { name: 'Request reason' });
    // Documented: "Request reason" is disabled by default and enables only after a real field change.
    // Confirmed bug (2026-10-13): the field is enabled from the moment the dialog opens - see vault note
    // 2026-10-13-channel-types-dirty-gating-ausente-en-edicion.md
    await expect(reason).toBeDisabled();
    await dialog.getByRole('textbox', { name: 'Name *' }).fill('Propios Plus');
    await expect(reason).toBeEnabled();
    await expect(dialog.locator('label', { hasText: 'Request reason' })).toHaveText('Request reason*');
  });

  test("TC-CHT-032 - 'Request reason' and 'Submit for Approval' stay disabled without a real change, including whitespace-only edits", async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('row', { name: /Aliados Integrales/ }).getByLabel('Edit').click();
    const dialog = page.getByRole('dialog');
    const reason = dialog.getByRole('textbox', { name: 'Request reason' });
    const submit = dialog.getByRole('button', { name: 'Submit for Approval' });
    const name = dialog.getByRole('textbox', { name: 'Name *' });
    // Documented: both stay disabled while untouched, and whitespace-only edits do not count as a change.
    // Confirmed bug (2026-10-13): neither ever disables on this demo - see vault note
    // 2026-10-13-channel-types-dirty-gating-ausente-en-edicion.md
    await expect(reason).toBeDisabled();
    await expect(submit).toBeDisabled();

    await name.fill('   ');
    await expect(reason).toBeDisabled();
    await expect(submit).toBeDisabled();

    await name.fill('Aliados Integrales ');
    await expect(reason).toBeDisabled();
    await expect(submit).toBeDisabled();

    await name.fill('Aliados Integrales');
    await expect(reason).toBeDisabled();
    await expect(submit).toBeDisabled();
  });

  test("TC-CHT-033 - 'Request reason' text alone does not count as a change", async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('row', { name: /Socios Estratégicos/ }).getByLabel('Edit').click();
    const dialog = page.getByRole('dialog');
    const reason = dialog.getByRole('textbox', { name: 'Request reason' });
    const submit = dialog.getByRole('button', { name: 'Submit for Approval' });
    const name = dialog.getByRole('textbox', { name: 'Name *' });

    await name.fill('Socios Estrategicos Plus');
    await reason.fill('QA TC-CHT-033');
    await name.fill('Socios Estratégicos');
    // Documented: reverting the real change disables Submit and Request reason again, even though the
    // reason text is still there. Confirmed bug (2026-10-13): both stay enabled the whole time on this
    // demo - see vault note 2026-10-13-channel-types-dirty-gating-ausente-en-edicion.md
    await expect(submit).toBeDisabled();
    await expect(reason).toBeDisabled();
    await expect(reason).toHaveValue('QA TC-CHT-033');
  });

  test("TC-CHT-034 - On create, 'Request reason' is enabled and optional", async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('button', { name: 'New Channel Type' }).click();
    const dialog = page.getByRole('dialog');
    const reason = dialog.getByRole('textbox', { name: 'Request reason' });
    await expectVisible(reason);
    await expect(reason).toBeEnabled();
    await expect(dialog.locator('label', { hasText: 'Request reason' })).toHaveText('Request reason');

    await dialog.getByRole('textbox', { name: 'Name *' }).fill('Retail Chain QA034');
    await dialog.getByRole('textbox', { name: 'Code *' }).fill('RETAIL_CHAIN_QA034');
    await dialog.getByRole('button', { name: 'Submit for Approval' }).click();
    await expectVisible(page.getByText('Submitted for approval.'));
  });

  test("TC-CHT-035 - 'Submit for Approval' stays disabled until a real change, then shows 'Submitting...' while processing", async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('row', { name: /Propios/ }).getByLabel('Edit').click();
    const dialog = page.getByRole('dialog');
    const submit = dialog.getByRole('button', { name: 'Submit for Approval' });
    // Documented: Submit stays disabled until a real change exists.
    // Confirmed bug (2026-10-13): Submit is enabled from the moment the dialog opens - see vault note
    // 2026-10-13-channel-types-dirty-gating-ausente-en-edicion.md
    await expect(submit).toBeDisabled();

    await dialog.getByRole('textbox', { name: 'Name *' }).fill('Propios Plus');
    await dialog.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-CHT-035');
    await expect(submit).toBeEnabled();
    await submit.click();
    // Documented: Submit shows "Submitting..." while the request is processed. Confirmed bug
    // (2026-10-13): it correctly disables in flight but its label never switches off "Submit for
    // Approval" - see vault note 2026-10-13-channel-types-dirty-gating-ausente-en-edicion.md
    await expect(submit).toHaveText('Submitting…');
  });

  test('TC-CHT-036 - A pending record has no reachable "frozen view" on this demo (no Name link, Edit disabled)', async ({ page }) => {
    await openChannelTypes(page);
    const row = page.getByRole('row', { name: /Desarrollos/ });
    await expectVisible(row.getByText('Pending'));
    // Documented: opening a pending record (via the Name link or Edit) shows a frozen, view-only dialog.
    // Not reproducible on this demo: Edit is disabled for a pending row (confirmed, TC-CHT-026), and the
    // Name cell is plain text here - never a clickable link/button, for any row, pending or not. The
    // source code (ChannelTypesListPage.tsx) does implement a clickable Name button gated on
    // access.canEdit/canView, but this demo build never renders it - same drift pattern already noted for
    // TC-CHT-006 and TC-CHT-009 in hallazgos-channel-types.md (demo lags behind the cloned frontend source).
    await expect(row.getByRole('button', { name: 'Edit' })).toBeDisabled();
    await expect(row.getByRole('button', { name: /Desarrollos/ })).toHaveCount(0);
  });

  test('TC-CHT-037 - Code stays locked/read-only when editing; Name and Management nature remain editable (documented, not enforced)', async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('row', { name: /Socios Estratégicos/ }).getByLabel('Edit').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('textbox', { name: 'Name *' })).toBeEnabled();
    await expect(dialog.getByRole('combobox', { name: 'Management nature *' })).toBeEnabled();
    // Documented: "Code can only be set on creation; it is locked/read-only on edit."
    // Confirmed bug (2026-10-06, reconfirmed 2026-10-13 against TC-CHT-037): the field is a normal
    // editable textbox - see vault note
    // 2026-10-06-channel-types-code-no-elimina-espacios-y-editable-en-edicion.md (BUG-02)
    await expect(dialog.getByRole('textbox', { name: 'Code *' })).toBeDisabled();
  });

  test("TC-CHT-038 - 'Management nature' defaults to 'Third-party' when creating", async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('button', { name: 'New Channel Type' }).click();
    const dialog = page.getByRole('dialog');
    const nature = dialog.getByRole('combobox', { name: 'Management nature *' });
    await expect(nature).toHaveText('Third-party');

    await nature.click();
    await page.getByRole('option', { name: 'Internal' }).click();
    await expect(nature).toHaveText('Internal');
  });

  test('TC-CHT-039, TC-CHT-040 - No permission system or second user/role to test a view-only/no-access user (not reproducible; also "Under Development" per the vendor)', async ({ page }) => {
    await page.getByRole('button', { name: 'DU Demo User' }).click();
    await expectVisible(page.getByRole('menuitem', { name: 'Profile' }));
    await expect(page.getByRole('menuitem', { name: /permission|role|rol|usuario/i })).toHaveCount(0);
  });

  test('TC-CHT-041 - A pending CREATE request card shows name, code and badges, without a field diff', async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('button', { name: 'New Channel Type' }).click();
    const createDialog = page.getByRole('dialog');
    await createDialog.getByRole('textbox', { name: 'Name *' }).fill('Retail Chain QA041');
    await createDialog.getByRole('textbox', { name: 'Code *' }).fill('RETAIL_CHAIN_QA041');
    await createDialog.getByRole('button', { name: 'Submit for Approval' }).click();
    await expectVisible(page.getByText('Submitted for approval.'));

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/masters/channel-types/requests');
    const card = page
      .locator('[data-slot="card"]')
      .filter({ hasText: 'Retail Chain QA041 · RETAIL_CHAIN_QA041' });
    await expectVisible(card);
    await expectVisible(card.getByText('Create', { exact: true }));
    await expectVisible(card.getByText('Pending', { exact: true }));
    await expectVisible(card.getByText(/Requested by .+ on /));
    // Documented: a pending CREATE card shows no field-by-field diff (the diff is edit-only).
    // Confirmed bug (2026-10-13): this demo renders the Code/Name/Management nature diff rows
    // on CREATE cards too - see vault note
    // 2026-10-13-channel-types-diff-en-create-y-activate-deactivate.md
    await expect(card.getByText('Code:')).toHaveCount(0);
  });

  test('TC-CHT-042 - A pending EDIT request card shows a field-by-field diff of only the changed fields', async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('row', { name: /Socios Estratégicos/ }).getByLabel('Edit').click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'Name *' }).fill('Socios Estrategicos Plus');
    await dialog.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-CHT-042');
    await dialog.getByRole('button', { name: 'Submit for Approval' }).click();

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/masters/channel-types/requests');
    const card = page
      .locator('[data-slot="card"]')
      .filter({ hasText: 'Socios Estratégicos · SOCIOS_ESTRATEGICOS' })
      .filter({ hasText: 'QA TC-CHT-042' });
    await expectVisible(card);
    await expectVisible(card.getByText('Edit', { exact: true }));
    await expect(card).toContainText('Name:');
    await expect(card).toContainText('Socios Estrategicos Plus');
    await expect(card.getByText('Code:')).toHaveCount(0);
    await expect(card.getByText('Management nature:')).toHaveCount(0);
  });

  test('TC-CHT-043 - A pending Activate/Deactivate request shows no field diff, same as a creation', async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('row', { name: /Aliados Integrales/ }).getByRole('button', { name: 'Deactivate' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-CHT-043');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/masters/channel-types/requests');
    const card = page
      .locator('[data-slot="card"]')
      .filter({ hasText: 'Aliados Integrales · ALIADOS_INTEGRALES' });
    await expectVisible(card);
    await expectVisible(card.getByText('Deactivate', { exact: true }));
    // Documented: no diff for Activate/Deactivate, same as a creation.
    // Confirmed bug (2026-10-13): this demo renders a Status diff row anyway - see vault note
    // 2026-10-13-channel-types-diff-en-create-y-activate-deactivate.md
    await expect(card.getByText('Status:')).toHaveCount(0);
  });

  test('TC-CHT-044 - Request reason only appears on the card when the request carries a non-empty reason', async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('button', { name: 'New Channel Type' }).click();
    const createDialog = page.getByRole('dialog');
    await createDialog.getByRole('textbox', { name: 'Name *' }).fill('Retail Chain QA044');
    await createDialog.getByRole('textbox', { name: 'Code *' }).fill('RETAIL_CHAIN_QA044');
    await createDialog.getByRole('button', { name: 'Submit for Approval' }).click();

    await page.getByRole('row', { name: /Socios Estratégicos/ }).getByLabel('Edit').click();
    const editDialog = page.getByRole('dialog');
    await editDialog.getByRole('textbox', { name: 'Name *' }).fill('Socios Estrategicos Plus QA044');
    await editDialog.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-CHT-044 edit reason');
    await editDialog.getByRole('button', { name: 'Submit for Approval' }).click();

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/masters/channel-types/requests');

    const createCard = page
      .locator('[data-slot="card"]')
      .filter({ hasText: 'Retail Chain QA044 · RETAIL_CHAIN_QA044' });
    await expectVisible(createCard);
    await expect(createCard.getByText('Request reason:')).toHaveCount(0);

    const editCard = page.locator('[data-slot="card"]').filter({ hasText: 'QA TC-CHT-044 edit reason' });
    await expectVisible(editCard);
    await expectVisible(editCard.getByText('Request reason:'));
  });

  test('TC-CHT-045 - Pending cards show Approve/Reject without Reviewed-by; resolved cards show Reviewed-by without action buttons', async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('row', { name: /Propios/ }).getByRole('button', { name: 'Deactivate' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-CHT-045 approve');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expectVisible(page.getByText('Submitted for approval', { exact: true }));
    await expect(page.getByText('Submitted for approval', { exact: true })).toBeHidden({ timeout: 10000 });

    await page.getByRole('row', { name: /Aliados Integrales/ }).getByRole('button', { name: 'Deactivate' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-CHT-045 reject');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expectVisible(page.getByText('Submitted for approval', { exact: true }));
    await expect(page.getByText('Submitted for approval', { exact: true })).toBeHidden({ timeout: 10000 });

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/masters/channel-types/requests');

    const approveCard = page.locator('[data-slot="card"]').filter({ hasText: 'QA TC-CHT-045 approve' });
    const rejectCard = page.locator('[data-slot="card"]').filter({ hasText: 'QA TC-CHT-045 reject' });
    await expectVisible(approveCard.getByRole('button', { name: 'Approve' }));
    await expectVisible(approveCard.getByRole('button', { name: 'Reject' }));
    await expect(approveCard.getByText('Reviewed by')).toHaveCount(0);

    await approveCard.getByRole('button', { name: 'Approve' }).click();
    await expectVisible(page.getByRole('dialog').getByRole('button', { name: 'Approve' }));
    await page.getByRole('dialog').getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await rejectCard.getByRole('button', { name: 'Reject' }).click();
    await page.getByRole('textbox', { name: 'Explain why this request' }).fill('QA TC-CHT-045 reject reason');
    await page.getByRole('dialog').getByRole('button', { name: 'Reject' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await expectVisible(approveCard.getByText(/Reviewed by .+ on /));
    await expect(approveCard.getByRole('button', { name: 'Approve' })).toHaveCount(0);
    await expect(approveCard.getByRole('button', { name: 'Reject' })).toHaveCount(0);

    await expectVisible(rejectCard.getByText(/Reviewed by .+ on /));
    await expectVisible(rejectCard.getByText('QA TC-CHT-045 reject reason'));
    await expect(rejectCard.getByRole('button', { name: 'Approve' })).toHaveCount(0);
    await expect(rejectCard.getByRole('button', { name: 'Reject' })).toHaveCount(0);
  });

  test('TC-CHT-046 - The request card title uses the live name on edits and the proposed name on creations', async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('row', { name: /Aliados Integrales/ }).getByLabel('Edit').click();
    const editDialog = page.getByRole('dialog');
    await editDialog.getByRole('textbox', { name: 'Name *' }).fill('Aliados Integrales Renamed QA046');
    await editDialog.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-CHT-046');
    await editDialog.getByRole('button', { name: 'Submit for Approval' }).click();

    await page.getByRole('button', { name: 'New Channel Type' }).click();
    const createDialog = page.getByRole('dialog');
    await createDialog.getByRole('textbox', { name: 'Name *' }).fill('Retail Chain QA046');
    await createDialog.getByRole('textbox', { name: 'Code *' }).fill('RETAIL_CHAIN_QA046');
    await createDialog.getByRole('button', { name: 'Submit for Approval' }).click();

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/masters/channel-types/requests');

    const editCard = page.locator('[data-slot="card"]').filter({ hasText: 'QA TC-CHT-046' });
    await expectVisible(editCard);
    const editTitleLine = (await editCard.innerText()).split('\n')[0];
    expect(editTitleLine).toBe('Aliados Integrales · ALIADOS_INTEGRALES');
    await expect(editCard).toContainText('Aliados Integrales Renamed QA046');

    const createCard = page.locator('[data-slot="card"]').filter({ hasText: 'RETAIL_CHAIN_QA046' });
    await expectVisible(createCard);
    const createTitleLine = (await createCard.innerText()).split('\n')[0];
    expect(createTitleLine).toBe('Retail Chain QA046 · RETAIL_CHAIN_QA046');
  });

  test('TC-CHT-047 - Deactivate/Activate confirmation requires a reason and the status does not change until approved', async ({ page }) => {
    await openChannelTypes(page);
    const row = page.getByRole('row', { name: /Socios Estratégicos/ });

    await row.getByRole('button', { name: 'Deactivate' }).click();
    const deactivateDialog = page.getByRole('alertdialog');
    await expectVisible(deactivateDialog.getByText('Submit deactivation for approval?'));
    await expectVisible(deactivateDialog.getByText('Inactive', { exact: true }));
    const deactivateSubmit = deactivateDialog.getByRole('button', { name: 'Submit for Approval' });
    await expect(deactivateSubmit).toBeDisabled();
    await deactivateDialog.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-CHT-047 deactivate');
    await expect(deactivateSubmit).toBeEnabled();
    await deactivateSubmit.click();
    await expectVisible(page.getByText('Submitted for approval', { exact: true }));
    await expect(page.getByRole('alertdialog')).toHaveCount(0, { timeout: 10000 });
    await expectVisible(row.getByText('Active', { exact: true }));
    await expectVisible(row.getByText('Pending'));

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/masters/channel-types/requests');
    const card = page.locator('[data-slot="card"]').filter({ hasText: 'QA TC-CHT-047 deactivate' });
    await card.getByRole('button', { name: 'Approve' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.locator('a').filter({ hasText: /^Channel Types$/ }).click();
    await page.waitForURL('**/masters/channel-types');
    await expectVisible(row.getByText('Inactive', { exact: true }));

    await row.getByRole('button', { name: 'Activate' }).click();
    const activateDialog = page.getByRole('alertdialog');
    await expectVisible(activateDialog.getByText('Submit activation for approval?'));
    await expectVisible(activateDialog.getByText('Active', { exact: true }));
    const activateSubmit = activateDialog.getByRole('button', { name: 'Submit for Approval' });
    await expect(activateSubmit).toBeDisabled();
    await activateDialog.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-CHT-047 activate');
    await expect(activateSubmit).toBeEnabled();
    await activateSubmit.click();
    await expectVisible(page.getByText('Submitted for approval', { exact: true }));
    await expect(page.getByRole('alertdialog')).toHaveCount(0, { timeout: 10000 });
    await expectVisible(row.getByText('Inactive', { exact: true }));
    await expectVisible(row.getByText('Pending'));
  });

  test('TC-CHT-048 - The Pending badge tooltip names the pending action or shows the literal status transition', async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('row', { name: /Propios/ }).getByLabel('Edit').click();
    const editDialog = page.getByRole('dialog');
    await editDialog.getByRole('textbox', { name: 'Name *' }).fill('Propios Plus QA048');
    await editDialog.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-CHT-048');
    await editDialog.getByRole('button', { name: 'Submit for Approval' }).click();

    await page.getByRole('row', { name: /Propios/ }).getByText('Pending').hover();
    const editTooltip = page.getByRole('tooltip');
    await expectVisible(editTooltip);
    await expect(editTooltip).toHaveText('Edit pending approval');

    await page.keyboard.press('Escape');
    await expect(page.getByRole('tooltip')).toHaveCount(0);

    await page.getByRole('row', { name: /Desarrollos/ }).getByText('Pending').hover();
    const lifecycleTooltip = page.getByRole('tooltip');
    await expectVisible(lifecycleTooltip);
    await expect(lifecycleTooltip).toHaveText('Active → Inactive');
  });

  test('TC-CHT-049 - Approval Requests: search by name/reason, status filter, request-type catalog, and Clear filters', async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('row', { name: /Aliados Integrales/ }).getByRole('button', { name: 'Deactivate' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-CHT-049 findme');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expect(page.getByRole('alertdialog')).toHaveCount(0, { timeout: 10000 });

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/masters/channel-types/requests');

    const searchBox = page.getByPlaceholder('Search by record or reason');
    await searchBox.fill('findme');
    await expectVisible(page.locator('[data-slot="card"]').filter({ hasText: 'Aliados Integrales' }));
    await expect(page.locator('[data-slot="card"]').filter({ hasText: 'Socios Estratégicos' })).toHaveCount(0);
    await searchBox.fill('');

    await expect(page.getByRole('button', { name: 'Clear filters' })).toHaveCount(0);
    const statusFilter = page.getByRole('combobox').nth(0);
    await statusFilter.click();
    await page.getByRole('option', { name: 'Pending' }).click();
    await expectVisible(page.getByRole('button', { name: 'Clear filters' }));
    await expectVisible(page.locator('[data-slot="card"]').filter({ hasText: 'QA TC-CHT-049 findme' }));
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(page.getByRole('button', { name: 'Clear filters' })).toHaveCount(0);

    const typeFilter = page.getByRole('combobox').nth(1);
    await typeFilter.click();
    const typeOptions = await page.getByRole('option').allInnerTexts();
    // Documented: the Request type filter offers a closed catalog (Create/Edit/Activate/Deactivate
    // only), since Channel Types has no Delete/Retire. Confirmed bug (2026-10-13): this demo offers
    // the full action catalog instead (Create/Edit/Delete/Activate/Deactivate/Retire/Revoke) - see
    // vault note 2026-10-13-channel-types-filtro-tipo-solicitud-catalogo-abierto.md
    expect(typeOptions).toEqual(['Any type', 'Create', 'Edit', 'Activate', 'Deactivate']);
    await page.keyboard.press('Escape');
  });

  test('TC-CHT-050 - Review dialog: Reject requires a comment, Approve is optional', async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('row', { name: /Propios/ }).getByRole('button', { name: 'Deactivate' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-CHT-050');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expect(page.getByRole('alertdialog')).toHaveCount(0, { timeout: 10000 });

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/masters/channel-types/requests');
    const card = page.locator('[data-slot="card"]').filter({ hasText: 'QA TC-CHT-050' });

    await card.getByRole('button', { name: 'Reject' }).click();
    const rejectDialog = page.getByRole('dialog');
    const rejectSubmit = rejectDialog.getByRole('button', { name: 'Reject' });
    await expectVisible(rejectDialog.locator('label', { hasText: 'Approver comment' }));
    await expect(rejectDialog.locator('label', { hasText: 'Approver comment' })).toHaveText('Approver comment*');
    await expect(rejectSubmit).toBeDisabled();
    await rejectDialog.getByRole('textbox', { name: 'Explain why this request' }).fill('QA TC-CHT-050 reject reason');
    await expect(rejectSubmit).toBeEnabled();
    await rejectDialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(rejectDialog).toHaveCount(0);

    await card.getByRole('button', { name: 'Approve' }).click();
    const approveDialog = page.getByRole('dialog');
    const approveSubmit = approveDialog.getByRole('button', { name: 'Approve' });
    await expectVisible(approveSubmit);
    await expect(approveDialog.locator('label', { hasText: 'Approver comment' })).toHaveText('Approver comment');
    await expect(approveSubmit).toBeEnabled();
    await approveSubmit.click();
    await expect(approveDialog).toHaveCount(0);
  });

  test("TC-CHT-051 - A decided request's reviewer comment shows only when it exists", async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('row', { name: /Propios/ }).getByRole('button', { name: 'Deactivate' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-CHT-051 with comment');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expectVisible(page.getByText('Submitted for approval', { exact: true }));
    await expect(page.getByText('Submitted for approval', { exact: true })).toBeHidden({ timeout: 10000 });

    await page.getByRole('row', { name: /Aliados Integrales/ }).getByRole('button', { name: 'Deactivate' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-CHT-051 no comment');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expect(page.getByRole('alertdialog')).toHaveCount(0, { timeout: 10000 });

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/masters/channel-types/requests');

    const withCommentCard = page.locator('[data-slot="card"]').filter({ hasText: 'QA TC-CHT-051 with comment' });
    const noCommentCard = page.locator('[data-slot="card"]').filter({ hasText: 'QA TC-CHT-051 no comment' });

    await withCommentCard.getByRole('button', { name: 'Approve' }).click();
    await page.getByRole('dialog').getByRole('textbox', { name: 'Optional note recorded' }).fill('QA TC-CHT-051 reviewer comment');
    await page.getByRole('dialog').getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await noCommentCard.getByRole('button', { name: 'Approve' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    const withCommentMeta = withCommentCard.locator('div.bg-muted\\/50');
    await expectVisible(withCommentMeta);
    await expect(withCommentMeta).toContainText(/Reviewed by .+ on /);
    await expect(withCommentMeta).toContainText('QA TC-CHT-051 reviewer comment');

    const noCommentMeta = noCommentCard.locator('div.bg-muted\\/50');
    await expectVisible(noCommentMeta);
    await expect(noCommentMeta).toHaveText(/^Reviewed by .+ on .+$/);
  });

  test('TC-CHT-052 - Edited values become active only once the edit request is approved', async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('row', { name: /Aliados Integrales/ }).getByLabel('Edit').click();
    const firstEditDialog = page.getByRole('dialog');
    await firstEditDialog.getByRole('textbox', { name: 'Name *' }).fill('Aliados Integrales QA052');
    await firstEditDialog.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-CHT-052 approve');
    await firstEditDialog.getByRole('button', { name: 'Submit for Approval' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await expectVisible(page.getByRole('row', { name: /Aliados Integrales ALIADOS_INTEGRALES/ }));
    await expect(page.getByRole('row', { name: /Aliados Integrales QA052/ })).toHaveCount(0);
    await expectVisible(page.getByRole('row', { name: /Aliados Integrales/ }).getByText('Pending'));

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/masters/channel-types/requests');
    const approveCard = page.locator('[data-slot="card"]').filter({ hasText: 'QA TC-CHT-052 approve' });
    await approveCard.getByRole('button', { name: 'Approve' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.locator('a').filter({ hasText: /^Channel Types$/ }).click();
    await page.waitForURL('**/masters/channel-types');
    await expectVisible(page.getByRole('row', { name: /Aliados Integrales QA052/ }), { timeout: 10000 });
    await expect(page.getByRole('row', { name: /Aliados Integrales QA052/ }).getByText('Pending')).toHaveCount(0);

    await page.getByRole('row', { name: /Socios Estratégicos/ }).getByLabel('Edit').click();
    const secondEditDialog = page.getByRole('dialog');
    await secondEditDialog.getByRole('textbox', { name: 'Name *' }).fill('Socios Estrategicos QA052');
    await secondEditDialog.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-CHT-052 reject');
    await secondEditDialog.getByRole('button', { name: 'Submit for Approval' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/masters/channel-types/requests');
    const rejectCard = page.locator('[data-slot="card"]').filter({ hasText: 'QA TC-CHT-052 reject' });
    await rejectCard.getByRole('button', { name: 'Reject' }).click();
    await page.getByRole('dialog').getByRole('textbox', { name: 'Explain why this request' }).fill('QA TC-CHT-052 reject reason');
    await page.getByRole('dialog').getByRole('button', { name: 'Reject' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.locator('a').filter({ hasText: /^Channel Types$/ }).click();
    await page.waitForURL('**/masters/channel-types');
    await expectVisible(page.getByRole('row', { name: /Socios Estratégicos SOCIOS_ESTRATEGICOS/ }));
    await expect(page.getByRole('row', { name: /Socios Estrategicos QA052/ })).toHaveCount(0);
    await expect(page.getByRole('row', { name: /Socios Estratégicos/ }).getByText('Pending')).toHaveCount(0);
  });

  test('TC-CHT-053 - A rejected creation can be corrected and resubmitted', async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('button', { name: 'New Channel Type' }).click();
    const firstDialog = page.getByRole('dialog');
    await firstDialog.getByRole('textbox', { name: 'Name *' }).fill('Retail Chain QA053');
    await firstDialog.getByRole('textbox', { name: 'Code *' }).fill('RETAIL_CHAIN_QA053');
    await firstDialog.getByRole('button', { name: 'Submit for Approval' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/masters/channel-types/requests');
    const firstCard = page
      .locator('[data-slot="card"]')
      .filter({ hasText: 'Retail Chain QA053 · RETAIL_CHAIN_QA053' });
    await firstCard.getByRole('button', { name: 'Reject' }).click();
    await page.getByRole('dialog').getByRole('textbox', { name: 'Explain why this request' }).fill('QA TC-CHT-053 rename needed');
    await page.getByRole('dialog').getByRole('button', { name: 'Reject' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expectVisible(firstCard.getByText('Rejected', { exact: true }));
    await expectVisible(firstCard.getByText('QA TC-CHT-053 rename needed'));

    await page.locator('a').filter({ hasText: /^Channel Types$/ }).click();
    await page.waitForURL('**/masters/channel-types');
    await page.getByRole('button', { name: 'New Channel Type' }).click();
    const secondDialog = page.getByRole('dialog');
    await secondDialog.getByRole('textbox', { name: 'Name *' }).fill('Retail Chain QA053 Fixed');
    await secondDialog.getByRole('textbox', { name: 'Code *' }).fill('RETAIL_CHAIN_QA053_FIXED');
    await secondDialog.getByRole('button', { name: 'Submit for Approval' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/masters/channel-types/requests');
    const secondCard = page
      .locator('[data-slot="card"]')
      .filter({ hasText: 'Retail Chain QA053 Fixed · RETAIL_CHAIN_QA053_FIXED' });
    await expectVisible(secondCard.getByText('Pending', { exact: true }));
    await expectVisible(firstCard.getByText('Rejected', { exact: true }));
    await expectVisible(firstCard.getByText('QA TC-CHT-053 rename needed'));
  });

  test('TC-CHT-054 - Only Active, approved channel types are offered for assignment in Channel Partners', async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('button', { name: 'New Channel Type' }).click();
    const createDialog = page.getByRole('dialog');
    await createDialog.getByRole('textbox', { name: 'Name *' }).fill('Retail Chain QA054 Pending');
    await createDialog.getByRole('textbox', { name: 'Code *' }).fill('RETAIL_CHAIN_QA054P');
    await createDialog.getByRole('combobox', { name: 'Management nature *' }).click();
    await page.getByRole('option', { name: 'Third-party' }).click();
    await createDialog.getByRole('button', { name: 'Submit for Approval' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.getByRole('row', { name: /Aliados Integrales/ }).getByRole('button', { name: 'Deactivate' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-CHT-054 deactivate');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expect(page.getByRole('alertdialog')).toHaveCount(0, { timeout: 10000 });

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/masters/channel-types/requests');
    const deactivateCard = page.locator('[data-slot="card"]').filter({ hasText: 'QA TC-CHT-054 deactivate' });
    await deactivateCard.getByRole('button', { name: 'Approve' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.locator('a').filter({ hasText: /^Channel Types$/ }).click();
    await page.waitForURL('**/masters/channel-types');
    await expectVisible(page.getByRole('row', { name: /Aliados Integrales/ }).getByText('Inactive', { exact: true }), { timeout: 10000 });

    await page.getByRole('link', { name: 'Channel Partners' }).click();
    await page.waitForURL('**/masters/channel-partners');
    await page.getByRole('button', { name: 'New Partner' }).click();
    await page.waitForURL('**/masters/channel-partners/new');
    await page.getByRole('combobox', { name: 'Channel type *' }).click();
    await expectVisible(page.getByRole('option', { name: 'Socios Estratégicos' }));
    await expect(page.getByRole('option', { name: 'Retail Chain QA054 Pending', exact: true })).toHaveCount(0);
    await expect(page.getByRole('option', { name: 'Aliados Integrales', exact: true })).toHaveCount(0);
  });

  test('TC-CHT-055 - A pending request blocks a second one on the same type; a no-op status change is never offered by the UI (API-level contract per source only, see note)', async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('row', { name: /Propios/ }).getByRole('button', { name: 'Deactivate' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-CHT-055');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expect(page.getByRole('alertdialog')).toHaveCount(0, { timeout: 10000 });

    const row = page.getByRole('row', { name: /Propios/ });
    await expect(row.getByRole('button', { name: 'Edit' })).toBeDisabled();
    await expect(row.getByRole('button', { name: 'Deactivate' })).toBeDisabled();
    // Documented 409/ALREADY_PENDING and the already-active/inactive no-op
    // rejection are API-level guards. Confirmed read-only in backend source,
    // not executed (no authorized backend environment to hit live):
    // APPROVAL_REQUEST_ALREADY_PENDING in approval-requests.service.ts:60-64
    // and :151-161, CHANNEL_TYPE_ALREADY_ACTIVE/INACTIVE via
    // assertActivationChangesState in approvable-master.service.ts:311-326.
    // The UI manifestation of the pending guard is Edit/Deactivate disabled,
    // already confirmed above and by TC-CHT-026; a no-op toggle is unreachable
    // through the UI at all, since a row only ever offers the opposite action
    // (this one only ever offers Deactivate here, never Activate, regardless
    // of the pending request).
    await expect(row.getByRole('button', { name: 'Activate', exact: true })).toHaveCount(0);
  });

  test('TC-CHT-056 - No second user/role to test maker-checker self-approval (not reproducible; guard confirmed read-only in backend source)', async ({ page }) => {
    await page.getByRole('button', { name: 'DU Demo User' }).click();
    await expectVisible(page.getByRole('menuitem', { name: 'Profile' }));
    await expect(page.getByRole('menuitem', { name: /permission|role|rol|usuario/i })).toHaveCount(0);
    // Backend source confirms SELF_APPROVAL_FORBIDDEN exists and is bypassed
    // for `super_admin` (read-only, not executed -
    // approval-requests.controller.ts:142-153, backend source). This demo's only
    // account is a super_admin, so Approve/Reject stay available on its own
    // requests here, same limitation already documented for
    // TC-CHT-025/027/039/040.
  });

  test('TC-CHT-057 - Reject requires a non-empty comment in the UI; the API-level contract cannot be confirmed (see note)', async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('row', { name: /Aliados Integrales/ }).getByRole('button', { name: 'Deactivate' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-CHT-057');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expect(page.getByRole('alertdialog')).toHaveCount(0, { timeout: 10000 });

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/masters/channel-types/requests');
    const card = page.locator('[data-slot="card"]').filter({ hasText: 'QA TC-CHT-057' });
    await card.getByRole('button', { name: 'Reject' }).click();
    const rejectSubmit = page.getByRole('dialog').getByRole('button', { name: 'Reject' });
    await expect(rejectSubmit).toBeDisabled();
    await page.getByRole('dialog').getByRole('textbox', { name: 'Explain why this request' }).fill('QA TC-CHT-057 reason');
    await expect(rejectSubmit).toBeEnabled();
    // The UI-level guard is confirmed above and already covered by
    // TC-CHT-023/TC-CHT-050. The exact API contract can't be confirmed without
    // an authorized backend. Read-only source inspection (not executed) is
    // inconclusive either way: approval-request.dto.ts:38-44 marks
    // `rejectionReason` as `@IsOptional()` with no non-empty validator, and
    // approval-requests.controller.spec.ts only exercises reject WITH a
    // reason - an open question for whoever picks up the authorized API test
    // batch, not asserted here as a confirmed bug.
  });

  test('TC-CHT-058 - A failed approval rolls back atomically (not reproducible - no way to force a server-side failure from the UI; see note)', () => {
    test.skip(
      true,
      'Requires forcing a server-side failure mid-approval; no API test infrastructure for Channel Types yet, and not reproducible from the UI of a demo with no real backend. Backend source (read-only, not executed - approval-requests.service.ts:196-226 `review()`, wrapped in `transactions.run`; comment at approval-requests.controller.ts:155-156 states the apply hooks run inside the same transaction) indicates the review is atomic by design, but that cannot be confirmed live without an authorized backend environment to inject a failure.',
    );
  });

  test('TC-CHT-059 - Approval Requests: search and filters narrow the list correctly (reconfirms BUG-06 for the Request type catalog)', async ({ page }) => {
    await openChannelTypes(page);
    await page.getByRole('row', { name: /Socios Estratégicos/ }).getByRole('button', { name: 'Deactivate' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-CHT-059 findme');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expect(page.getByRole('alertdialog')).toHaveCount(0, { timeout: 10000 });

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/masters/channel-types/requests');

    const searchBox = page.getByPlaceholder('Search by record or reason');
    await searchBox.fill('QA TC-CHT-059 findme');
    // Filtering runs client-side against the demo's in-memory data (no
    // approval-requests network call was ever observed while probing this
    // search box), so asserting on the whole card count - rather than the
    // absence of one specific pre-existing/seeded card - stays correct
    // regardless of how much other history this shared demo has accumulated.
    await expect(page.locator('[data-slot="card"]')).toHaveCount(1, { timeout: 10000 });
    await expectVisible(page.locator('[data-slot="card"]').filter({ hasText: 'Socios Estratégicos' }));
    await searchBox.fill('');

    await expect(page.getByRole('button', { name: 'Clear filters' })).toHaveCount(0);
    const statusFilter = page.getByRole('combobox').nth(0);
    await statusFilter.click();
    await page.getByRole('option', { name: 'Pending' }).click();
    await expectVisible(page.getByRole('button', { name: 'Clear filters' }));
    await expectVisible(page.locator('[data-slot="card"]').filter({ hasText: 'QA TC-CHT-059 findme' }));
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(page.getByRole('button', { name: 'Clear filters' })).toHaveCount(0);

    const typeFilter = page.getByRole('combobox').nth(1);
    await typeFilter.click();
    const typeOptions = await page.getByRole('option').allInnerTexts();
    await page.keyboard.press('Escape');
    // Documented: the Request type filter offers a closed catalog
    // (Create/Edit/Activate/Deactivate only), since Channel Types has no
    // Delete/Retire. Reconfirms BUG-06
    // (2026-10-13-channel-types-filtro-tipo-solicitud-catalogo-abierto.md):
    // this demo still offers the full action catalog instead.
    expect(typeOptions).toEqual(['Any type', 'Create', 'Edit', 'Activate', 'Deactivate']);

    await typeFilter.click();
    await page.getByRole('option', { name: 'Activate', exact: true }).click();
    await expectVisible(page.getByRole('button', { name: 'Clear filters' }));
    await expect(page.locator('[data-slot="card"]').filter({ hasText: 'QA TC-CHT-059 findme' })).toHaveCount(0);
  });

  test('TC-CHT-060 - No second user/role to test permission-gated row actions (not reproducible; "Under Development" per the vendor; guard confirmed read-only in frontend source)', async ({ page }) => {
    await page.getByRole('button', { name: 'DU Demo User' }).click();
    await expectVisible(page.getByRole('menuitem', { name: 'Profile' }));
    await expect(page.getByRole('menuitem', { name: /permission|role|rol|usuario/i })).toHaveCount(0);
    // Frontend source (read-only, confirmed in this session -
    // ChannelTypesListPage.tsx:85-91, 136, 283-294) gates "New Channel Type",
    // Edit and Activate/Deactivate behind access.canCreate/canEdit, consistent
    // with the documented rule - but this demo's single super_admin account
    // always has every permission, same limitation already documented for
    // TC-CHT-025/027/039/040.
  });

  test('TC-CHT-061 - API-level permission guard on create/update/activation/approve/reject (not reproducible; no second user/role; guard confirmed read-only in backend source)', async ({ page }) => {
    await page.getByRole('button', { name: 'DU Demo User' }).click();
    await expectVisible(page.getByRole('menuitem', { name: 'Profile' }));
    await expect(page.getByRole('menuitem', { name: /permission|role|rol|usuario/i })).toHaveCount(0);
    // Backend source (read-only, not executed - no authorized backend
    // environment to hit live) confirms every write endpoint is gated
    // server-side, independent of the UI: channel-types.controller.ts declares
    // @RequirePlatformPermission("channel-types", "canCreate") on POST :78,
    // "canEdit" on PUT :93 and on the activation POST :id :110. The guard that
    // enforces it, PlatformPermissionGuard.canActivate
    // (platform-permission.guard.ts:103-111), throws
    // ForbiddenException({code:"PLATFORM_PERMISSION_DENIED"}) (403) whenever
    // user.permissions[module][action] is falsy. Approve/Reject go through a
    // separate dynamic guard: approval-requests.controller.ts:119-120 declares
    // @RequireDynamicPermission("canApprove") on review(), and
    // assertEntityPermission (approval-requests.controller.ts:35-56, called at
    // :140) throws the same ForbiddenException/PLATFORM_PERMISSION_DENIED when
    // the resolved module permission is missing. This demo's only account is a
    // super_admin with every permission granted, so none of these 403s can be
    // forced live - same limitation already documented for
    // TC-CHT-025/027/039/040/056/060.
  });

  test('TC-CHT-062 - Approve/Reject require the canApprove permission, distinct from view/edit (not reproducible; no second user/role; guard confirmed read-only in frontend and backend source)', async ({ page }) => {
    await page.getByRole('button', { name: 'DU Demo User' }).click();
    await expectVisible(page.getByRole('menuitem', { name: 'Profile' }));
    await expect(page.getByRole('menuitem', { name: /permission|role|rol|usuario/i })).toHaveCount(0);
    // Documented: a user with view/edit but no approval permission should
    // still see the Approval Requests tab, with Approve/Reject hidden, and the
    // API should reject a direct call. Confirmed in source (read-only, not
    // executed - no second role to run live): the frontend's
    // canReviewApprovalRequest (review.ts:4-17) returns false and hides
    // Approve/Reject whenever user.permissions['channel-types']?.canApprove is
    // falsy, independently of canView/canEdit; it is wired as the canReview
    // prop into ApprovalQueue at ChannelTypeRequestsPage.tsx:86. The Approval
    // Requests tab itself (ChannelTypesLayout.tsx:24-31) carries no permission
    // gate at all, so it stays visible regardless - matching the documented
    // behavior exactly. Server-side, approval-requests.controller.ts:119-120/140
    // requires "canApprove" via assertEntityPermission (same guard cited for
    // TC-CHT-061), so a direct API call bypassing the hidden button would 403
    // too. This demo's only account is a super_admin with every permission
    // granted, so the hidden-button/403 pair can't be forced live - same
    // limitation already documented for TC-CHT-025/027/039/040/056/060/061.
  });

  test('TC-CHT-063 - Responsive layout (desktop/mobile) and baseline accessibility: labelled fields, visible keyboard focus, badge contrast', async ({ page }) => {
    await openChannelTypes(page);

    const pendingBadge = page.getByRole('row', { name: /Desarrollos/ }).getByText('Pending');
    await expectVisible(pendingBadge);
    const badgeContrast = await getEffectiveContrastRatio(pendingBadge);
    expect(badgeContrast).toBeGreaterThanOrEqual(4.5);

    await page.getByRole('button', { name: 'New Channel Type' }).click();
    const createDialog = page.getByRole('dialog');
    const nameInput = createDialog.getByRole('textbox', { name: 'Name *' });
    const codeInput = createDialog.getByRole('textbox', { name: 'Code *' });
    await expectVisible(nameInput);
    const nameLabelCount = await nameInput.evaluate((el) => (el as HTMLInputElement).labels?.length ?? 0);
    const codeLabelCount = await codeInput.evaluate((el) => (el as HTMLInputElement).labels?.length ?? 0);
    expect(nameLabelCount).toBeGreaterThan(0);
    expect(codeLabelCount).toBeGreaterThan(0);

    await nameInput.focus();
    await page.keyboard.press('Tab');
    await expect(codeInput).toBeFocused();
    const hasVisibleFocus = await codeInput.evaluate((el) => {
      const style = getComputedStyle(el);
      const outlineVisible = style.outlineStyle !== 'none' && style.outlineWidth !== '0px';
      const boxShadowVisible = style.boxShadow !== 'none';
      return outlineVisible || boxShadowVisible;
    });
    expect(hasVisibleFocus).toBe(true);
    await createDialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.setViewportSize({ width: 375, height: 667 });
    const listScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const listClientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(listScrollWidth).toBeLessThanOrEqual(listClientWidth);
    await expectVisible(page.getByRole('button', { name: 'New Channel Type' }));

    await page.getByRole('button', { name: 'New Channel Type' }).click();
    const mobileDialog = page.getByRole('dialog');
    await expectVisible(mobileDialog);
    const submitButton = mobileDialog.getByRole('button', { name: 'Submit for Approval' });
    await expectVisible(submitButton);
    const submitBox = await submitButton.boundingBox();
    expect(submitBox).not.toBeNull();
    expect(submitBox!.x + submitBox!.width).toBeLessThanOrEqual(375);
    await mobileDialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/masters/channel-types/requests');
    const requestsScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const requestsClientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(requestsScrollWidth).toBeLessThanOrEqual(requestsClientWidth);
    await expectVisible(page.getByRole('button', { name: 'Approve' }).first());
  });
});
