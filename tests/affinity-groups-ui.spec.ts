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

async function openAffinityGroups(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Masters' }).click();
  await page.getByRole('listitem').filter({ hasText: /^Customer Segments/ }).click();
  await page.getByRole('link', { name: 'Affinity Groups' }).click();
  await page.waitForURL('**/masters/segments/affinity-groups');
}

test.describe('Affinity Groups - UI (demo environment via BASE_URL, no real backend)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === testInfo.expectedStatus) return;
    const alreadyCaptured = testInfo.attachments.some((a) => a.name === 'bug-evidence');
    if (alreadyCaptured) return;
    await captureFailureEvidence(page, testInfo);
  });

  test('TC-AG-001 - Navigate to Affinity Groups from Customer Segments', async ({ page }) => {
    await openAffinityGroups(page);
    await expectVisible(page.getByRole('heading', { name: 'Affinity Groups' }));
    await expectVisible(page.getByRole('link', { name: 'Approval Requests' }));
    await expectVisible(page.getByRole('button', { name: 'New Affinity Group' }));
  });

  test('TC-AG-002 - The Approval Requests tab shows a badge with the pending count', async ({ page }) => {
    await openAffinityGroups(page);
    for (const rowName of ['CONATEL Schools', 'CORPORATE']) {
      await page.getByRole('row', { name: new RegExp(rowName) }).getByLabel('Edit').click();
      await page.getByRole('textbox', { name: 'Request reason' }).fill('QA automated seed');
      await page.getByRole('button', { name: 'Submit for Approval' }).click();
      await page.waitForURL('**/masters/segments/affinity-groups');
    }
    await expectVisible(page.getByRole('link', { name: 'Approval Requests 2' }));
  });

  test('TC-AG-003 - Switching between the list tab and Approval Requests produces no errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await openAffinityGroups(page);
    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await page.goBack();
    await page.waitForURL('**/masters/segments/affinity-groups');
    expect(consoleErrors).toHaveLength(0);
  });

  test('TC-AG-004 - New Affinity Group opens a blank creation form; a name opens edit', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('button', { name: 'New Affinity Group' }).click();
    await page.waitForURL('**/affinity-groups/new');
    await page.goto('/masters/segments/affinity-groups');
    await page.getByRole('button', { name: 'EMPLOYEE' }).click();
    await page.waitForURL('**/affinity-groups/af_employee/edit');
  });

  test('TC-AG-005 - The list shows all columns; the Approval filter no longer exists in Filters (discrepancy vs. documented)', async ({ page }) => {
    await openAffinityGroups(page);
    for (const col of ['Name', 'Code', 'Subscription type', 'Discount %', 'Country', 'Approval', 'Status', 'Last updated']) {
      await expectVisible(page.getByRole('columnheader', { name: col }));
    }
    await page.getByRole('button', { name: 'Filters' }).click();
    for (const placeholder of ['Any subscription type', 'Any country']) {
      await expectVisible(page.getByText(placeholder, { exact: true }));
    }
    await expect(page.getByText('Any approval', { exact: true })).toHaveCount(0);
  });

  test('TC-AG-006 - Searching by name filters the list', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('textbox', { name: 'Search by name or code…' }).fill('Corp');
    await expectVisible(page.getByRole('row', { name: /CORPORATE/ }));
    await expectVisible(page.getByText('Showing 1-1 of 1'));
  });

  test('TC-AG-007 - Searching by code filters the list', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('textbox', { name: 'Search by name or code…' }).fill('CORP');
    await expectVisible(page.getByRole('row', { name: /CORPORATE/ }));
    await expectVisible(page.getByText('Showing 1-1 of 1'));
  });

  test('TC-AG-008 - Filter by Subscription type (Prepaid/Postpaid/Hybrid)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('button', { name: 'Filters' }).click();
    const subscriptionCombo = page.getByRole('combobox').filter({ hasText: 'Any subscription type' });

    await subscriptionCombo.click();
    await page.getByRole('option', { name: 'Prepaid' }).click();
    await expectVisible(page.getByText('No affinity groups found.'));

    await page.getByRole('combobox').filter({ hasText: 'Prepaid' }).click();
    await page.getByRole('option', { name: 'Postpaid' }).click();
    await expectVisible(page.getByText('Showing 1-3 of 3'));

    await page.getByRole('combobox').filter({ hasText: 'Postpaid' }).click();
    await page.getByRole('option', { name: 'Hybrid' }).click();
    await expectVisible(page.getByText('Showing 1-1 of 1'));
    await expectVisible(page.getByRole('row', { name: /EXONERATED/ }));
  });

  test('TC-AG-009 - Filter by Country (Venezuela)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('button', { name: 'Filters' }).click();
    await page.getByRole('combobox').filter({ hasText: 'Any country' }).click();
    await page.getByRole('option', { name: '🇻🇪 Venezuela' }).click();
    await expectVisible(page.getByText('Showing 1-4 of 4'));
  });

  test('TC-AG-010 - The Approval status filter no longer exists; it is not possible to filter by Pending/Approved (discrepancy vs. documented)', async ({ page }) => {
    await openAffinityGroups(page);

    await page.getByRole('row', { name: /CONATEL Schools/ }).getByLabel('Edit').click();
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA automated seed');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await page.getByRole('button', { name: 'Filters' }).click();
    await expect(page.getByRole('combobox').filter({ hasText: 'Any approval' })).toHaveCount(0);
    await expect(page.getByRole('option', { name: 'Approved' })).toHaveCount(0);
  });

  test('TC-AG-011 - Combine filters (Subscription type + Country) and clear them all', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('button', { name: 'Filters' }).click();

    await page.getByRole('combobox').filter({ hasText: 'Any subscription type' }).click();
    await page.getByRole('option', { name: 'Postpaid' }).click();
    await page.getByRole('combobox').filter({ hasText: 'Any country' }).click();
    await page.getByRole('option', { name: '🇻🇪 Venezuela' }).click();
    await expect(page.getByText('Showing 1-3 of 3')).toBeVisible();

    await page.getByRole('button', { name: 'Clear Filters' }).click();
    await expect(page.getByText('Showing 1-4 of 4')).toBeVisible();
    await expect(page.getByRole('combobox').filter({ hasText: 'Any subscription type' })).toBeVisible();
    await expect(page.getByRole('combobox').filter({ hasText: 'Any country' })).toBeVisible();
  });

  test('TC-AG-012 - Approval status badges render with the correct tone', async ({ page }) => {
    await openAffinityGroups(page);

    await page.getByRole('row', { name: /CONATEL Schools/ }).getByLabel('Edit').click();
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA automated seed');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await page.getByRole('row', { name: /EXONERATED/ }).getByRole('button', { name: 'Retire' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA automated seed');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await page.getByRole('button', { name: 'Reject' }).nth(1).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Reject' }).click();

    await page.goBack();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await expect(page.getByRole('row', { name: /CONATEL Schools/ }).getByText('-', { exact: true })).toBeVisible();
    await expect(page.getByRole('row', { name: /EXONERATED/ }).getByText('Pending')).toBeVisible();
    await expect(page.getByRole('row', { name: /EMPLOYEE/ }).getByText('-', { exact: true })).toBeVisible();
  });

  test('TC-AG-013 - The Status column shows Active and Inactive only after Deactivate is approved (Retired not reproducible except via Retire, see TC-AG-039)', async ({ page }) => {
    await openAffinityGroups(page);

    await expect(page.getByRole('row', { name: /EMPLOYEE/ }).getByText('Active')).toBeVisible();

    await page.getByRole('row', { name: /EMPLOYEE/ }).getByRole('button', { name: 'Deactivate' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA automated seed');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await expect(page.getByRole('row', { name: /EMPLOYEE/ }).getByText('Active')).toBeVisible();
    await expect(page.getByRole('row', { name: /EMPLOYEE/ }).getByText('Pending')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Approval Requests 1' })).toBeVisible();

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await page.getByRole('button', { name: 'Approve' }).click();

    await page.getByRole('link', { name: 'Affinity Groups' }).nth(2).click();
    await page.waitForURL('**/masters/segments/affinity-groups');
    await expect(page.getByRole('row', { name: /EMPLOYEE/ }).getByText('Inactive')).toBeVisible();
  });

  test('TC-AG-014 - The Discount % column is formatted correctly', async ({ page }) => {
    await openAffinityGroups(page);
    await expect(page.getByRole('row', { name: /CORPORATE/ }).getByText('20%')).toBeVisible();
    await expect(page.getByRole('row', { name: /EMPLOYEE/ }).getByText('100%')).toBeVisible();
  });

  test('TC-AG-015 - Pagination and empty state', async ({ page }) => {
    await openAffinityGroups(page);
    await expect(page.getByRole('combobox').filter({ hasText: '10' })).toBeVisible();

    await page.getByRole('textbox', { name: 'Search by name or code…' }).fill('zzzzz');
    await expect(page.getByText('No affinity groups found.')).toBeVisible();
    await expect(page.getByText('No results')).toBeVisible();
  });

  test('TC-AG-016 - Creating a valid affinity group submits it for approval (pending)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('button', { name: 'New Affinity Group' }).click();
    await page.waitForURL('**/affinity-groups/new');

    await page.getByRole('textbox', { name: 'Name *' }).fill('QA Corporate');
    await page.getByRole('textbox', { name: 'Code *' }).fill('corpqa');
    await page.getByRole('spinbutton', { name: 'Discount % *' }).fill('15');
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA automated creation');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();

    await page.waitForURL('**/masters/segments/affinity-groups');
    await expect(page.getByRole('row', { name: /QA Corporate/ }).getByText('Pending')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Approval Requests 1' })).toBeVisible();
  });

  test('TC-AG-017 - Code is automatically converted to uppercase while typing', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('button', { name: 'New Affinity Group' }).click();
    await page.waitForURL('**/affinity-groups/new');

    await page.getByRole('textbox', { name: 'Code *' }).fill('corpqa');
    await expect(page.getByRole('textbox', { name: 'Code *' })).toHaveValue('CORPQA');
  });

  test('TC-AG-018 - Subscription type selection (Prepaid/Postpaid/Hybrid)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('button', { name: 'New Affinity Group' }).click();
    await page.waitForURL('**/affinity-groups/new');

    await page.getByRole('combobox', { name: 'Subscription type *' }).click();
    await expect(page.getByRole('option', { name: 'Prepaid' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Postpaid' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Hybrid' })).toBeVisible();
    await page.getByRole('option', { name: 'Hybrid' }).click();
    await expect(page.getByRole('combobox', { name: 'Subscription type *' })).toHaveText('Hybrid');
  });

  test('TC-AG-019 - Discount % accepts values from 0 to 100', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('button', { name: 'New Affinity Group' }).click();
    await page.waitForURL('**/affinity-groups/new');

    const discount = page.getByRole('spinbutton', { name: 'Discount % *' });
    await discount.fill('0');
    await expect(discount).toHaveValue('0');
    await discount.fill('100');
    await expect(discount).toHaveValue('100');
    await discount.fill('12.5');
    await expect(discount).toHaveValue('12.5');
  });

  test('TC-AG-020 - An approval-note banner is shown on the form', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('button', { name: 'New Affinity Group' }).click();
    await page.waitForURL('**/affinity-groups/new');
    await expect(
      page.getByText('Segmentation masters require review and validation before they go live.'),
    ).toBeVisible();
  });

  test('TC-AG-021 - On successful creation, a toast is shown and the user returns to the list', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('button', { name: 'New Affinity Group' }).click();
    await page.waitForURL('**/affinity-groups/new');

    await page.getByRole('textbox', { name: 'Name *' }).fill('QA Group 021');
    await page.getByRole('textbox', { name: 'Code *' }).fill('QA021');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();

    await page.waitForURL('**/masters/segments/affinity-groups');
    await expect(page.getByText('Submitted for approval.')).toBeVisible();
    await expect(page.getByRole('row', { name: /QA Group 021/ })).toBeVisible();
  });

  test('TC-AG-022 - Name is required (2-60 characters)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('button', { name: 'New Affinity Group' }).click();
    await page.waitForURL('**/affinity-groups/new');

    await page.getByRole('textbox', { name: 'Code *' }).fill('QA022');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expect(page.url()).toContain('/affinity-groups/new');
    await expect(page.getByRole('textbox', { name: 'Name *' })).toHaveAttribute('aria-invalid', 'true');

    await page.getByRole('textbox', { name: 'Name *' }).fill('A'.repeat(61));
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expect(page.url()).toContain('/affinity-groups/new');
    await expect(page.getByRole('textbox', { name: 'Name *' })).toHaveAttribute('aria-invalid', 'true');
  });

  test('TC-AG-023 - Code is required (2-20 characters)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('button', { name: 'New Affinity Group' }).click();
    await page.waitForURL('**/affinity-groups/new');

    await page.getByRole('textbox', { name: 'Name *' }).fill('QA Group 023');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expect(page.url()).toContain('/affinity-groups/new');
    await expect(page.getByRole('textbox', { name: 'Code *' })).toHaveAttribute('aria-invalid', 'true');
  });

  test('TC-AG-024 - Code rejects invalid characters', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('button', { name: 'New Affinity Group' }).click();
    await page.waitForURL('**/affinity-groups/new');

    await page.getByRole('textbox', { name: 'Name *' }).fill('QA Group 024');
    await page.getByRole('textbox', { name: 'Code *' }).fill('CO RP!');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expect(page.url()).toContain('/affinity-groups/new');
    await expect(page.getByRole('textbox', { name: 'Code *' })).toHaveAttribute('aria-invalid', 'true');
  });

  test('TC-AG-025 - Duplicate code rejected on create', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('button', { name: 'New Affinity Group' }).click();
    await page.waitForURL('**/affinity-groups/new');

    await page.getByRole('textbox', { name: 'Name *' }).fill('QA Group 025 original');
    await page.getByRole('textbox', { name: 'Code *' }).fill('QA025');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await page.getByRole('button', { name: 'New Affinity Group' }).click();
    await page.waitForURL('**/affinity-groups/new');
    await page.getByRole('textbox', { name: 'Name *' }).fill('QA Group 025 duplicate');
    await page.getByRole('textbox', { name: 'Code *' }).fill('QA025');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();

    await expect(page.getByText('Code QA025 already exists')).toBeVisible();
    await expect(page.url()).toContain('/affinity-groups/new');
  });

  test('TC-AG-026 - Discount % is required and must be within 0-100', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('button', { name: 'New Affinity Group' }).click();
    await page.waitForURL('**/affinity-groups/new');

    await page.getByRole('textbox', { name: 'Name *' }).fill('QA Group 026');
    await page.getByRole('textbox', { name: 'Code *' }).fill('QA026');
    const discount = page.getByRole('spinbutton', { name: 'Discount % *' });

    await discount.fill('150');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expect(page.url()).toContain('/affinity-groups/new');
    await expect(discount).toHaveValue('150');

    await discount.fill('-5');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expect(page.url()).toContain('/affinity-groups/new');
    await expect(discount).toHaveValue('-5');

    await discount.fill('');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expect(page.url()).toContain('/affinity-groups/new');
    await expect(discount).toHaveAttribute('aria-invalid', 'true');
  });

  test('TC-AG-027 - Country is required (only valid VE/DO/PE values selectable)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('button', { name: 'New Affinity Group' }).click();
    await page.waitForURL('**/affinity-groups/new');

    await page.getByRole('combobox', { name: 'Country *' }).click();
    await expect(page.getByRole('option', { name: '🇻🇪 Venezuela' })).toBeVisible();
    await expect(page.getByRole('option', { name: '🇩🇴 República Dominicana' })).toBeVisible();
    await expect(page.getByRole('option', { name: '🇵🇪 Perú' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('combobox', { name: 'Country *' })).toHaveText(/Venezuela/);
  });

  test('TC-AG-028 - Duplicate code rejected on edit; keeping the group\'s own code is allowed', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /EMPLOYEE/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_employee/edit');

    await page.getByRole('textbox', { name: 'Code *' }).fill('CORPORATE');
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-AG-028');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expect(page.getByText('Code CORPORATE already exists')).toBeVisible();
    await expect(page.url()).toContain('/affinity-groups/af_employee/edit');

    await page.getByRole('textbox', { name: 'Code *' }).fill('EMPLOYEE');
    await page.getByRole('textbox', { name: 'Code *' }).press('Enter');
    await page.waitForURL('**/masters/segments/affinity-groups');
    await expect(page.getByRole('row', { name: /EMPLOYEE/ }).getByText('Pending')).toBeVisible();
  });

  test('TC-AG-029 - Editing a group resubmits it for approval (Pending)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_corporate/edit');

    await page.getByRole('textbox', { name: 'Name *' }).fill('CORPORATE EDITED');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();

    await page.waitForURL('**/masters/segments/affinity-groups');
    await expect(page.getByRole('row', { name: /CORPORATE EDITED/ }).getByText('Pending')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Approval Requests 1' })).toBeVisible();
  });

  test('TC-AG-030 - Editing without a Request reason does not block submission (discrepancy vs. documented)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_corporate/edit');

    await page.getByRole('textbox', { name: 'Name *' }).fill('CORPORATE NO REASON');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();

    await page.waitForURL('**/masters/segments/affinity-groups');
    await expect(page.getByText('Submitted for approval.')).toBeVisible();
    await expect(page.getByRole('row', { name: /CORPORATE NO REASON/ }).getByText('Pending')).toBeVisible();
  });

  test('TC-AG-031 - Cancel returns to the list without saving', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CONATEL Schools/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_conatel_schools/edit');

    await page.getByRole('textbox', { name: 'Name *' }).fill('CONATEL Schools UNSAVED CHANGE');
    await page.getByRole('link', { name: 'Cancel' }).click();

    await page.waitForURL('**/masters/segments/affinity-groups');
    await expect(page.getByText('UNSAVED CHANGE')).not.toBeVisible();
    await expect(page.getByRole('row', { name: /CONATEL Schools/ }).getByText('-', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Approval Requests' })).not.toHaveText(/Approval Requests \d/);
  });

  test('TC-AG-032 - Deactivate goes to Pending and only applies Inactive once approved (confirms documented behavior; previous bypass resolved)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByRole('button', { name: 'Deactivate' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-AG-032');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();

    await expect(page.getByRole('row', { name: /CORPORATE/ }).getByText('Active')).toBeVisible();
    await expect(page.getByRole('row', { name: /CORPORATE/ }).getByText('Pending')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Approval Requests 1' })).toBeVisible();

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await page.getByRole('button', { name: 'Approve' }).click();

    await page.getByRole('link', { name: 'Affinity Groups' }).nth(2).click();
    await page.waitForURL('**/masters/segments/affinity-groups');
    await expect(page.getByRole('row', { name: /CORPORATE/ }).getByText('Inactive')).toBeVisible();
  });

  test('TC-AG-033 - Activate goes to Pending and only applies Active once approved (confirms documented behavior; previous bypass resolved)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByRole('button', { name: 'Deactivate' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-AG-033 seed');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await page.getByRole('button', { name: 'Approve' }).click();
    await page.getByRole('link', { name: 'Affinity Groups' }).nth(2).click();
    await page.waitForURL('**/masters/segments/affinity-groups');
    await expect(page.getByRole('row', { name: /CORPORATE/ }).getByText('Inactive')).toBeVisible();

    await page.getByRole('row', { name: /CORPORATE/ }).getByRole('button', { name: 'Activate' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-AG-033');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expect(page.getByRole('row', { name: /CORPORATE/ }).getByText('Inactive')).toBeVisible();
    await expect(page.getByRole('row', { name: /CORPORATE/ }).getByText('Pending')).toBeVisible();

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await page.getByRole('button', { name: 'Approve' }).click();

    await page.getByRole('link', { name: 'Affinity Groups' }).nth(2).click();
    await page.waitForURL('**/masters/segments/affinity-groups');
    await expect(page.getByRole('row', { name: /CORPORATE/ }).getByText('Active')).toBeVisible();
  });

  test('TC-AG-034 and TC-AG-035 - Approve/reject a status-change request (now reproducible; previous bypass resolved)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByRole('button', { name: 'Deactivate' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-AG-034-035');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await expect(page.getByText('Deactivation requested')).toBeVisible();
    await page.getByRole('button', { name: 'Reject' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Reject' }).click();
    await expect(page.getByText('All caught up')).toBeVisible();

    await page.getByRole('link', { name: 'Affinity Groups' }).nth(2).click();
    await page.waitForURL('**/masters/segments/affinity-groups');
    await expect(page.getByRole('row', { name: /CORPORATE/ }).getByText('Active')).toBeVisible();
  });

  test('TC-AG-036 - The row\'s destructive action is now called Retire, as documented by the vendor (confirms documented behavior; previous naming resolved)', async ({ page }) => {
    await openAffinityGroups(page);
    await expect(page.getByRole('row', { name: /CORPORATE/ }).getByRole('button', { name: 'Retire' })).toBeVisible();
    await expect(page.getByRole('row', { name: /CORPORATE/ }).getByRole('button', { name: 'Delete' })).toHaveCount(0);
  });

  test('TC-AG-037 - Retire/Delete is NOT available on the edit screen', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_corporate/edit');

    await expect(page.getByRole('button', { name: 'Delete' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Retire' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Cancel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit for Approval' })).toBeVisible();
  });

  test('TC-AG-038 - Delete (retire) submits an approval request; the group remains active until approved', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByRole('button', { name: 'Retire' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-AG-038');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();

    await expect(page.getByText('Retirement submitted for approval.')).toBeVisible();
    await expect(page.getByRole('row', { name: /CORPORATE/ }).getByText('Pending')).toBeVisible();
    await expect(page.getByRole('row', { name: /CORPORATE/ }).getByText('Active')).toBeVisible();
  });

  test('TC-AG-039 - Approving a retire request marks the record as Retired and keeps it in the list (confirms documented behavior; previous hard-delete resolved)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByRole('button', { name: 'Retire' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-AG-039');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await page.getByRole('button', { name: 'Approve' }).click();

    await page.getByRole('link', { name: 'Affinity Groups' }).nth(2).click();
    await page.waitForURL('**/masters/segments/affinity-groups');
    await expect(page.getByRole('row', { name: /CORPORATE/ }).getByText('Retired')).toBeVisible();
    await expect(page.getByText('Showing 1-4 of 4')).toBeVisible();
    await expect(page.getByRole('row', { name: /CORPORATE/ }).getByRole('button', { name: 'Edit' })).toBeDisabled();
  });

  test('TC-AG-040 - Rejecting a retire request keeps the group', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByRole('button', { name: 'Retire' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-AG-040');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await page.getByRole('button', { name: 'Reject' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Reject' }).click();

    await page.getByRole('link', { name: 'Affinity Groups' }).nth(2).click();
    await page.waitForURL('**/masters/segments/affinity-groups');
    await expect(page.getByRole('row', { name: /CORPORATE/ }).getByText('-', { exact: true })).toBeVisible();
    await expect(page.getByRole('row', { name: /CORPORATE/ }).getByText('Active')).toBeVisible();
    await expect(page.getByText('Showing 1-4 of 4')).toBeVisible();
  });

  test('TC-AG-041 - A group is always retirable, with no reference/usage block', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByRole('button', { name: 'Retire' }).click();
    await expect(page.getByRole('alertdialog', { name: 'Submit retirement for approval?' })).toBeVisible();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-AG-041 group in use');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();

    await expect(page.getByText('Retirement submitted for approval.')).toBeVisible();
    await expect(page.getByRole('row', { name: /CORPORATE/ }).getByText('Pending')).toBeVisible();
  });

  test('TC-AG-042 - Approving a pending request decrements the badge and the group becomes Approved', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_corporate/edit');
    await page.getByRole('spinbutton', { name: 'Discount % *' }).fill('25');
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-AG-042');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');
    await expect(page.getByRole('link', { name: 'Approval Requests 1' })).toBeVisible();

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await page.getByRole('button', { name: 'Approve' }).click();

    await expect(page.getByRole('link', { name: 'Approval Requests' })).not.toHaveText(/Approval Requests \d/);
    await page.getByRole('link', { name: 'Affinity Groups' }).nth(2).click();
    await page.waitForURL('**/masters/segments/affinity-groups');
    await expect(page.getByRole('row', { name: /CORPORATE/ }).getByText('-', { exact: true })).toBeVisible();
  });

  test('TC-AG-043 - Rejecting a pending request with a reason', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CONATEL Schools/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_conatel_schools/edit');
    await page.getByRole('spinbutton', { name: 'Discount % *' }).fill('55');
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-AG-043');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await page.getByRole('button', { name: 'Reject' }).click();
    await page.getByRole('textbox', { name: 'e.g. Needs sign-off from' }).fill('Not aligned with policy');
    await page.getByRole('dialog').getByRole('button', { name: 'Reject' }).click();

    await expect(page.getByText('CONATEL-SCH rejected.')).toBeVisible();
  });

  test('TC-AG-044 - The request row shows name, code, requester and reason; a retire one shows its tag', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_corporate/edit');
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-AG-044 visible reason');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await page.getByRole('row', { name: /EXONERATED/ }).getByRole('button', { name: 'Retire' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-AG-044 retire tag');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await expect(page.getByText('CORPORATE').first()).toBeVisible();
    await expect(page.getByText('María Pérez').first()).toBeVisible();
    await expect(page.getByText('QA TC-AG-044 visible reason')).toBeVisible();
    await expect(page.getByText('Retirement requested')).toBeVisible();
  });

  test('TC-AG-045 - Editing an approved group resubmits it for approval (segregation of duties not verifiable: single-user demo)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_corporate/edit');
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-AG-045');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();

    await page.waitForURL('**/masters/segments/affinity-groups');
    await expect(page.getByRole('row', { name: /CORPORATE/ }).getByText('Pending')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Approval Requests 1' })).toBeVisible();
  });

  test('TC-AG-046 - Approval Requests does NOT keep resolved requests (discrepancy vs. documented)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_corporate/edit');
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-AG-046');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await page.getByRole('button', { name: 'Approve' }).click();

    await expect(page.getByText('All caught up')).toBeVisible();
    await expect(page.getByText('No segmentation-master changes are waiting for approval.')).toBeVisible();
  });

  test('TC-AG-047 - An approved request does NOT remain visible (discrepancy vs. documented)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_corporate/edit');
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-AG-047');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await page.getByRole('button', { name: 'Approve' }).click();

    await expect(page.getByText('CORPORATE approved.')).toBeVisible();
    await expect(page.getByText('CORPORATE approved.')).toBeHidden({ timeout: 10000 });
    await expect(page.getByText('CORPORATE')).toHaveCount(0);
    await expect(page.getByText('All caught up')).toBeVisible();
  });

  test('TC-AG-048 - A rejected request does NOT remain visible with its reason (discrepancy vs. documented)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CONATEL Schools/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_conatel_schools/edit');
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-AG-048');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await page.getByRole('button', { name: 'Reject' }).click();
    await page.getByRole('textbox', { name: 'e.g. Needs sign-off from' }).fill('Not aligned with policy');
    await page.getByRole('dialog').getByRole('button', { name: 'Reject' }).click();

    await expect(page.getByText('CONATEL-SCH rejected.')).toBeVisible();
    await expect(page.getByText('Not aligned with policy')).toHaveCount(0);
    await expect(page.getByText('All caught up')).toBeVisible();
  });

  test('TC-AG-049 - There is no viewer role/second user to test read-only mode (not reproducible)', async ({ page }) => {
    await page.getByRole('button', { name: 'DU Demo User' }).click();
    await expect(page.getByRole('menuitem', { name: 'Profile' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Change Password' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Log out' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /switch|role|viewer/i })).toHaveCount(0);
  });

  test('TC-AG-050 - The tab does NOT work as a full audit trail: everything is purged once resolved (discrepancy vs. documented)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_corporate/edit');
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-AG-050 approve');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await page.getByRole('row', { name: /CONATEL Schools/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_conatel_schools/edit');
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-AG-050 reject');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await page.getByRole('button', { name: 'Approve' }).first().click();
    await page.getByRole('button', { name: 'Reject' }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: 'Reject' }).click();

    await expect(page.getByText('All caught up')).toBeVisible();
    await expect(page.getByText('No segmentation-master changes are waiting for approval.')).toBeVisible();
  });

  test('TC-AG-051 - The Pending card shows no status badge at all (not reproducible: Approved/Rejected never coexist for comparison)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_corporate/edit');
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-AG-051');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await expect(page.getByRole('button', { name: 'Approve' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reject' })).toBeVisible();
    await expect(page.getByText('Pending', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Approved', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Rejected', { exact: true })).toHaveCount(0);
  });

  test('TC-AG-052 - An approved request is NOT kept in Approval Requests, even though the group does end up Approved in the list', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_corporate/edit');
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-AG-052');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await page.getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByText('All caught up')).toBeVisible();

    await page.getByRole('link', { name: 'Affinity Groups' }).nth(2).click();
    await page.waitForURL('**/masters/segments/affinity-groups');
    await expect(page.getByRole('row', { name: /CORPORATE/ }).getByText('-', { exact: true })).toBeVisible();
  });

  test('TC-AG-053 - The badge only counts Pending; the list does NOT show all statuses (discrepancy vs. documented)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_corporate/edit');
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-AG-053 pending');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await page.getByRole('row', { name: /CONATEL Schools/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_conatel_schools/edit');
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-AG-053 approve');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');
    await expect(page.getByRole('link', { name: 'Approval Requests 2' })).toBeVisible();

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await page.getByRole('button', { name: 'Approve' }).first().click();

    await expect(page.getByRole('link', { name: 'Approval Requests 1' })).toBeVisible();
    await expect(page.getByText('CONATEL Schools')).toHaveCount(0);
  });

  test('TC-AG-054 - Approve/Reject only exist on Pending rows (vacuous truth: there is never an Approved/Rejected row to inspect)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_corporate/edit');
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-AG-054');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await page.getByRole('button', { name: 'Approve' }).click();

    await expect(page.getByRole('button', { name: 'Approve' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Reject' })).toHaveCount(0);
  });

  test('TC-AG-055 - Resolved retire/status-change requests are NOT kept with a type+outcome tag (discrepancy vs. documented)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByRole('button', { name: 'Retire' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-AG-055 retire');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await page.getByRole('button', { name: 'Approve' }).click();

    await expect(page.getByText('Retire - Approved')).toHaveCount(0);
    await expect(page.getByText('All caught up')).toBeVisible();
  });

  test('TC-AG-056 - There is no status filter (Approved/Rejected/Pending/All) in Approval Requests', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_corporate/edit');
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-AG-056');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');

    await expect(page.getByRole('combobox').filter({ hasText: 'Any type' })).toBeVisible();
    await expect(page.getByRole('combobox').filter({ hasText: /Any status|All statuses/i })).toHaveCount(0);
  });

  test('TC-AG-057 - The empty state appears even though requests were resolved during the session (discrepancy vs. documented)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_corporate/edit');
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-AG-057');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await page.getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByText('CORPORATE approved.')).toBeVisible();

    await expect(page.getByText('All caught up')).toBeVisible();
    await expect(page.getByText('No segmentation-master changes are waiting for approval.')).toBeVisible();
  });

  test('TC-AG-058, TC-AG-059 and TC-AG-060 - No permission system or second user to test visibility Rules (not reproducible; also "Under Development" per the vendor)', async ({ page }) => {
    await page.getByRole('button', { name: 'DU Demo User' }).click();
    await expect(page.getByRole('menuitem', { name: 'Profile' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Change Password' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /permission|role|rol/i })).toHaveCount(0);
  });

  test('TC-AG-061 - With an Edit Pending, Deactivate/Retire become disabled but Edit still opens the form in read-only mode (previous guard resolved)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_corporate/edit');
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-AG-061');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await expect(page.getByRole('row', { name: /CORPORATE/ }).getByRole('button', { name: 'Edit' })).toBeEnabled();
    await expect(page.getByRole('row', { name: /CORPORATE/ }).getByRole('button', { name: 'Deactivate' })).toBeDisabled();
    await expect(page.getByRole('row', { name: /CORPORATE/ }).getByRole('button', { name: 'Retire' })).toBeDisabled();

    await page.getByRole('row', { name: /CORPORATE/ }).getByLabel('Edit').click();
    await expect(page.getByText('Read-only while a request is pending')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Name *' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Submit for Approval' })).toHaveCount(0);
  });

  test('TC-AG-062 - The exact documented text ("a request is already pending") does not appear, but a tooltip reusing the Pending badge\'s text does (partial discrepancy vs. documented)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_corporate/edit');
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-AG-062');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await page.getByRole('row', { name: /CORPORATE/ }).getByRole('button', { name: 'Deactivate' }).hover({ force: true });
    await expect(page.getByText('An approval request is already pending for this affinity group.')).toHaveCount(0);
    await expect(page.getByText('Edit pending approval')).toBeVisible();
  });

  test('TC-AG-063 - A second request (Retire) no longer overwrites the pending one (Edit): the button is disabled and blocks the attempt (confirms documented behavior; previous guard resolved)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_corporate/edit');
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-AG-063 edit');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');
    await expect(page.getByRole('link', { name: 'Approval Requests 1' })).toBeVisible();

    await expect(page.getByRole('row', { name: /CORPORATE/ }).getByRole('button', { name: 'Retire' })).toBeDisabled();

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await expect(page.getByText('QA TC-AG-063 edit')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Approval Requests 1' })).toBeVisible();
  });

  test('TC-AG-066 and TC-AG-067 - No permission system to test blocking direct URL access to view-only/no-module (not reproducible; also "Under Development" per the vendor)', async ({ page }) => {
    await page.getByRole('button', { name: 'DU Demo User' }).click();
    await expect(page.getByRole('menuitem', { name: 'Profile' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Change Password' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /permission|role|rol/i })).toHaveCount(0);
  });

  test('TC-AG-064 - The duplicate guard applies per individual group; other groups are not affected', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_corporate/edit');
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-AG-064');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await expect(page.getByRole('row', { name: /EMPLOYEE/ }).getByRole('button', { name: 'Edit' })).toBeEnabled();
    await expect(page.getByRole('row', { name: /EMPLOYEE/ }).getByRole('button', { name: 'Deactivate' })).toBeEnabled();
    await expect(page.getByRole('row', { name: /EMPLOYEE/ }).getByRole('button', { name: 'Retire' })).toBeEnabled();
  });

  test('TC-AG-065 - Edit becomes editable again after the pending request is approved', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_corporate/edit');
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-AG-065');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await page.getByRole('button', { name: 'Approve' }).click();

    await page.getByRole('link', { name: 'Affinity Groups' }).nth(2).click();
    await page.waitForURL('**/masters/segments/affinity-groups');
    await page.getByRole('row', { name: /CORPORATE/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_corporate/edit');

    await expect(page.getByText('Read-only while a request is pending')).toHaveCount(0);
    await expect(page.getByRole('textbox', { name: 'Name *' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Submit for Approval' })).toBeVisible();
  });

  test('TC-AG-068 - Duplicate code shows an error and the form keeps the entered data', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('button', { name: 'New Affinity Group' }).click();
    await page.waitForURL('**/affinity-groups/new');

    await page.getByRole('textbox', { name: 'Name *' }).fill('QA Group 068');
    await page.getByRole('textbox', { name: 'Code *' }).fill('CORPORATE');
    await page.getByRole('spinbutton', { name: 'Discount % *' }).fill('33');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();

    await expect(page.getByText('Code CORPORATE already exists')).toBeVisible();
    await expect(page.url()).toContain('/affinity-groups/new');
    await expect(page.getByRole('textbox', { name: 'Name *' })).toHaveValue('QA Group 068');
    await expect(page.getByRole('textbox', { name: 'Code *' })).toHaveValue('CORPORATE');
    await expect(page.getByRole('spinbutton', { name: 'Discount % *' })).toHaveValue('33');
  });

  test('TC-AG-069 - The mock\'s state is not shared across tabs; the "two tabs, same data" precondition is not reproducible', async ({ page, context }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_corporate/edit');
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-AG-069');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');
    await expect(page.getByRole('link', { name: 'Approval Requests 1' })).toBeVisible();

    const secondPage = await context.newPage();
    await secondPage.goto('/masters/segments/affinity-groups/requests');
    await expect(secondPage.getByText('All caught up')).toBeVisible();
    await secondPage.close();
  });

  test('TC-AG-070 - Localization: labels, tabs and subscription types translate correctly to Spanish', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('button', { name: 'New Affinity Group' }).click();
    await page.waitForURL('**/affinity-groups/new');

    await page.getByRole('button', { name: 'Change Language' }).click();
    await expect(page.getByRole('heading', { name: 'Nuevo grupo de afinidad' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Nombre *' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Código *' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Tipo de suscripción *' })).toHaveText('Pospago');
    await expect(page.getByRole('link', { name: 'Cancelar' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enviar para aprobación' })).toBeVisible();
    await expect(page.getByText('validation.', { exact: false })).toHaveCount(0);
  });

  test('TC-AG-071 - The creation card does NOT show a CREATE badge (discrepancy vs. documented)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('button', { name: 'New Affinity Group' }).click();
    await page.waitForURL('**/affinity-groups/new');
    await page.getByRole('textbox', { name: 'Name *' }).fill('QA Group 071');
    await page.getByRole('textbox', { name: 'Code *' }).fill('QA071');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await expect(page.getByText('QA Group 071')).toBeVisible();
    await expect(page.getByText('CREATE', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Request reason:')).toHaveCount(0);
  });

  test('TC-AG-072 - The edit card does NOT show a field-by-field diff (discrepancy vs. documented)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_corporate/edit');
    await page.getByRole('textbox', { name: 'Name *' }).fill('CORPORATE RENAMED');
    await page.getByRole('spinbutton', { name: 'Discount % *' }).fill('45');
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-AG-072 field diff');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await expect(page.getByText('Request reason:')).toBeVisible();
    await expect(page.getByText('QA TC-AG-072 field diff')).toBeVisible();
    await expect(page.getByText('CORPORATE →')).toHaveCount(0);
    await expect(page.getByText('20% →')).toHaveCount(0);
  });

  test('TC-AG-073 - Retire cards do not show a field diff (consistent with TC-AG-072: no card shows a diff)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByRole('button', { name: 'Retire' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-AG-073');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await expect(page.getByText('Retirement requested')).toBeVisible();
    await expect(page.getByText('Active →')).toHaveCount(0);
  });

  test('TC-AG-076 - The edit card\'s title uses the PROPOSED name, not the current one (discrepancy vs. documented)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_corporate/edit');
    await page.getByRole('textbox', { name: 'Name *' }).fill('CORPORATE RENAMED');
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-AG-076');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await expect(page.getByText('CORPORATE RENAMED')).toBeVisible();
  });

  test('TC-AG-077 - Deactivate requires a reason before enabling submission', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByRole('button', { name: 'Deactivate' }).click();
    await expect(page.getByRole('button', { name: 'Submit for Approval' })).toBeDisabled();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-AG-077');
    await expect(page.getByRole('button', { name: 'Submit for Approval' })).toBeEnabled();
  });

  test('TC-AG-078 - Retire (Delete) requires a reason before enabling submission', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByRole('button', { name: 'Retire' }).click();
    await expect(page.getByRole('button', { name: 'Submit for Approval' })).toBeDisabled();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-AG-078');
    await expect(page.getByRole('button', { name: 'Submit for Approval' })).toBeEnabled();
  });

  test('TC-AG-079 - Approve resolves instantly with no dialog; the Reject reason is still marked optional (discrepancy vs. documented)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('button', { name: 'New Affinity Group' }).click();
    await page.waitForURL('**/affinity-groups/new');
    await page.getByRole('textbox', { name: 'Name *' }).fill('QA Group 079');
    await page.getByRole('textbox', { name: 'Code *' }).fill('QA079');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await page.getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByText('QA079 approved.')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.getByRole('link', { name: 'Affinity Groups' }).nth(2).click();
    await page.waitForURL('**/masters/segments/affinity-groups');
    await page.getByRole('row', { name: /CORPORATE/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_corporate/edit');
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-AG-079 reject');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');
    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await page.getByRole('button', { name: 'Reject' }).click();
    await expect(page.getByText('Reason (optional)')).toBeVisible();
  });

  test('TC-AG-080 - The Pending badge in the main list DOES show a tooltip naming the pending action on hover (confirms documented behavior)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_corporate/edit');
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-AG-080');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await page.getByRole('row', { name: /CORPORATE/ }).getByText('Pending', { exact: true }).hover();
    await expect(page.getByText('Edit pending approval')).toBeVisible();
  });

  test('TC-AG-081 - The read-only Edit form DOES have a Request reason field (disabled and empty), even though the vendor documents it should not exist (discrepancy vs. documented)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_corporate/edit');
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-AG-081 real reason');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await page.getByRole('row', { name: /CORPORATE/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_corporate/edit');
    await expect(page.getByText('Read-only while a request is pending')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit for Approval' })).toHaveCount(0);
    await expect(page.getByRole('textbox', { name: 'Request reason' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Request reason' })).toBeDisabled();
    await expect(page.getByRole('textbox', { name: 'Request reason' })).toHaveValue('');
  });

  test('TC-AG-082 - Column headers are NOT sortable: clicking does not change row order or show an indicator (discrepancy vs. documented)', async ({ page }) => {
    await openAffinityGroups(page);
    const firstRowBefore = await page.locator('table tbody tr').first().innerText();
    await page.getByRole('columnheader', { name: 'Name' }).click();
    const firstRowAfter = await page.locator('table tbody tr').first().innerText();
    expect(firstRowAfter).toBe(firstRowBefore);
  });

  test('TC-AG-083 - Request reason and Submit for Approval are enabled from the start; an edit with no real change still submits (discrepancy vs. documented)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /EXONERATED/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_exonerated/edit');
    await expect(page.getByRole('textbox', { name: 'Request reason' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Submit for Approval' })).toBeEnabled();

    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');
    await expect(page.getByRole('row', { name: /EXONERATED/ }).getByText('Pending', { exact: true })).toBeVisible();
  });

  test('TC-AG-084 - Name is not validated for uniqueness (neither exact nor case-insensitive) on create (discrepancy vs. documented)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('button', { name: 'New Affinity Group' }).click();
    await page.waitForURL('**/affinity-groups/new');
    await page.getByRole('textbox', { name: 'Name *' }).fill('CORPORATE');
    await page.getByRole('textbox', { name: 'Code *' }).fill('DUPNAME');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await expect(page.getByRole('row', { name: /CORPORATE DUPNAME/ })).toBeVisible();
  });

  test('TC-AG-085 - Edited values already show in the list while Pending, and persist after Reject instead of reverting (discrepancy vs. documented)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_corporate/edit');
    await page.getByRole('spinbutton', { name: 'Discount % *' }).fill('77');
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-AG-085');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');
    await expect(page.getByRole('row', { name: /CORPORATE/ }).getByText('77%')).toBeVisible();

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await page.getByRole('button', { name: 'Reject' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Reject' }).click();

    await page.getByRole('link', { name: 'Affinity Groups' }).nth(2).click();
    await page.waitForURL('**/masters/segments/affinity-groups');
    await expect(page.getByRole('row', { name: /CORPORATE/ }).getByText('77%')).toBeVisible();
    await expect(page.getByRole('row', { name: /CORPORATE/ }).getByText('-', { exact: true })).toBeVisible();
  });

  test('TC-AG-086 - A rejected new group can be corrected and resubmitted, but Status stays Active (not Inactive) and the card does not identify the Create type (discrepancy vs. documented)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('button', { name: 'New Affinity Group' }).click();
    await page.waitForURL('**/affinity-groups/new');
    await page.getByRole('textbox', { name: 'Name *' }).fill('Test086');
    await page.getByRole('textbox', { name: 'Code *' }).fill('TEST086');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await page.getByRole('button', { name: 'Reject' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Reject' }).click();

    await page.getByRole('link', { name: 'Affinity Groups' }).nth(2).click();
    await page.waitForURL('**/masters/segments/affinity-groups');
    await expect(page.getByRole('row', { name: /Test086/ }).getByText('-', { exact: true })).toBeVisible();
    await expect(page.getByRole('row', { name: /Test086/ }).getByText('Active')).toBeVisible();

    await page.getByRole('row', { name: /Test086/ }).getByLabel('Edit').click();
    await page.getByRole('spinbutton', { name: 'Discount % *' }).fill('10');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await expect(page.getByText('CREATE', { exact: true })).toHaveCount(0);
    await expect(page.getByText('UPDATE', { exact: true })).toHaveCount(0);
  });

  test('TC-AG-087 - Discount % blocks out-of-range values or 3 decimals with no visible error; a valid value is not normalized to 2 decimals and the list rounds it to a whole number (discrepancy vs. documented)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('button', { name: 'New Affinity Group' }).click();
    await page.waitForURL('**/affinity-groups/new');
    await page.getByRole('textbox', { name: 'Name *' }).fill('Test087');
    await page.getByRole('textbox', { name: 'Code *' }).fill('TEST087');

    await page.getByRole('spinbutton', { name: 'Discount % *' }).fill('150');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expect(page).toHaveURL(/\/new$/);

    await page.getByRole('spinbutton', { name: 'Discount % *' }).fill('12.345');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await expect(page).toHaveURL(/\/new$/);

    await page.getByRole('spinbutton', { name: 'Discount % *' }).fill('12.5');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await expect(page.getByRole('row', { name: /Test087/ }).getByText('13%')).toBeVisible();
  });

  test('TC-AG-088 - Subscription Type only offers the 3 active values (Prepaid/Postpaid/Hybrid); rejecting an inactive value via API is not reproducible without a real backend', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('button', { name: 'New Affinity Group' }).click();
    await page.waitForURL('**/affinity-groups/new');
    await page.getByRole('combobox', { name: 'Subscription type *' }).click();
    await expect(page.getByRole('option', { name: 'Prepaid' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Postpaid' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Hybrid' })).toBeVisible();
    await expect(page.getByRole('option')).toHaveCount(3);
  });

  test('TC-AG-089 - The Country selector only has 3 seeded countries (no exercisable pagination); rejecting an unknown country via API is not reproducible without a real backend (demo data limitation)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('button', { name: 'New Affinity Group' }).click();
    await page.waitForURL('**/affinity-groups/new');
    await page.getByRole('combobox', { name: 'Country *' }).click();
    await expect(page.getByRole('option')).toHaveCount(3);
    await expect(page.getByRole('option', { name: /Venezuela/ })).toBeVisible();
    await expect(page.getByRole('option', { name: /República Dominicana/ })).toBeVisible();
    await expect(page.getByRole('option', { name: /Perú/ })).toBeVisible();
  });

  test('TC-AG-090 - The GET /api/v1/affinity-groups/lookup endpoint is purely API, with no UI surface; not reproducible without a real backend', async ({ page }) => {
    await openAffinityGroups(page);
    const apiRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/')) apiRequests.push(req.url());
    });
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Affinity Groups' })).toBeVisible();
    expect(apiRequests).toHaveLength(0);
  });

  test('TC-AG-091 - API guards (409/422/400/404) are purely API-level; not reproducible without a real backend', async ({ page }) => {
    await openAffinityGroups(page);
    const apiRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/')) apiRequests.push(req.url());
    });
    await page.getByRole('row', { name: /CONATEL Schools/ }).getByRole('button', { name: 'Deactivate' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-AG-091');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');
    expect(apiRequests).toHaveLength(0);
  });

  test('TC-AG-092 - Approve/Reject controls for the current user\'s own request are NEVER hidden (discrepancy vs. documented; self-approval not prevented in the UI)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_corporate/edit');
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-AG-092');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await expect(page.getByRole('button', { name: 'Approve' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Reject' })).toBeEnabled();
  });

  test('TC-AG-093 - The Reject reason is still not mandatory in the UI (discrepancy vs. documented: the vendor assumes the UI DOES enforce it)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByLabel('Edit').click();
    await page.waitForURL('**/affinity-groups/af_corporate/edit');
    await page.getByRole('textbox', { name: 'Request reason' }).fill('QA TC-AG-093');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await page.getByRole('button', { name: 'Reject' }).click();
    await expect(page.getByText('Reason (optional)')).toBeVisible();
    await expect(page.getByRole('dialog').getByRole('button', { name: 'Reject' })).toBeEnabled();
  });

  test('TC-AG-094 - A rollback of a failed approval requires forcing an invalid state via the backend; not reproducible without a real backend', async ({ page }) => {
    await openAffinityGroups(page);
    const apiRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/')) apiRequests.push(req.url());
    });
    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    expect(apiRequests).toHaveLength(0);
  });

  test('TC-AG-095 - The Request Type filter only offers the types of the currently pending requests, not all possible types (Create/Activate/Deactivate/Retire never coexist as options) (corrects earlier theory)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('row', { name: /CORPORATE/ }).getByRole('button', { name: 'Deactivate' }).click();
    await page.getByRole('textbox', { name: 'Why is this change being' }).fill('QA TC-AG-095');
    await page.getByRole('button', { name: 'Submit for Approval' }).click();
    await page.waitForURL('**/masters/segments/affinity-groups');

    await page.getByRole('link', { name: 'Approval Requests' }).click();
    await page.waitForURL('**/requests');
    await expect(page.getByText('Deactivation requested')).toBeVisible();

    await page.getByRole('combobox').filter({ hasText: 'Any type' }).click();
    await expect(page.getByRole('option', { name: 'Deactivate' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Create' })).toHaveCount(0);
    await expect(page.getByRole('option', { name: 'Edit' })).toHaveCount(0);
    await expect(page.getByRole('option', { name: 'Retire' })).toHaveCount(0);
  });

  test('TC-AG-096 - There is no Status filter (Active/Inactive/Retired) in the Filters panel (discrepancy vs. documented)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.getByRole('button', { name: 'Filters' }).click();
    await expect(page.locator('label').filter({ hasText: 'Subscription type' })).toBeVisible();
    await expect(page.locator('label').filter({ hasText: 'Country' })).toBeVisible();
    await expect(page.locator('label').filter({ hasText: 'Status' })).toHaveCount(0);
  });

  test('TC-AG-097, TC-AG-098 and TC-AG-099 - No permission system or second user/role to test Viewer/Editor restrictions (not reproducible; also "Under Development" per the vendor)', async ({ page }) => {
    await page.getByRole('button', { name: 'DU Demo User' }).click();
    await expect(page.getByRole('menuitem', { name: 'Profile' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Change Password' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /permission|role|rol/i })).toHaveCount(0);
  });

  test('TC-AG-100 - At 375px width there is no horizontal page scroll (partial verification: a full axe/keyboard audit was not run)', async ({ page }) => {
    await openAffinityGroups(page);
    await page.setViewportSize({ width: 375, height: 667 });
    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalScroll).toBe(false);
  });
});
