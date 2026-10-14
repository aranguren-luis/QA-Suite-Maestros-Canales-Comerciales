# Findings — Affinity Groups Module

Bug report confirmed against the demo (`BASE_URL`), verified live and automated in `affinity-groups-ui.spec.ts`. Pending re-verification against the real backend (the master-data backend repo)

Structure per finding (Description / Severity / Cause / Steps to Reproduce)

## Summary

| # | Title | Severity | Test Cases |
|---|---|---|---|
| BUG-01 | Edit does not respect the approval flow: values persist after Reject | **High** | TC-AG-081, 083, 084, 085 |
| BUG-02 | Approval Requests is not an audit trail: resolved requests disappear | **High** | TC-AG-046, 047, 048, 050, 052, 053, 055, 056, 057 |
| BUG-03 | Request reason is not required when editing, despite being documented as mandatory | Medium | TC-AG-030 |
| BUG-04 | Approval Request cards show no action badges or field diff; Approve has no dialog | Medium | TC-AG-071, 072, 076, 079 |
| BUG-05 | Discount % is not normalized to 2 decimals; the list rounds to a whole number | Medium | TC-AG-087 |
| BUG-06 | Filters panel has no Status filter; lost the Approval filter after the redeploy | Medium | TC-AG-010, 011, 096 |
| BUG-07 | Self-approval not prevented in the UI | Medium | TC-AG-092 |
| BUG-08 | Validation messages show raw, untranslated i18n keys | Low | TC-AG-022, 024, 026 |
| BUG-09 | Column sorting in the list is not implemented | Low | TC-AG-082 |

---

### BUG-01 — Edit does not respect the approval flow: values persist after Reject

| Field | Detail |
|---|---|
| Severity | **High** |
| Test Cases | TC-AG-081, TC-AG-083, TC-AG-084, TC-AG-085 |
| Cause | The mock applies the change directly to the in-memory record on submit (optimistic update with no rollback); neither Approve nor Reject reconcile against the actually-current value. |

**Steps to reproduce:**
1. Edit an Approved group, changing Discount %, with a reason → Submit.
2. The list already shows the proposed value with Approval = Pending.
3. Reject the request.
4. The list keeps the proposed value with Approval = Rejected — **it does not revert to the original value**.

---

### BUG-02 — Approval Requests is not an audit trail: resolved requests disappear

| Field | Detail |
|---|---|
| Severity | **High** |
| Test Cases | TC-AG-046, TC-AG-047, TC-AG-048, TC-AG-050, TC-AG-052, TC-AG-053, TC-AG-055, TC-AG-056, TC-AG-057 |
| Cause | The pending-requests store behaves like a queue (the item is removed once resolved) instead of a log with persisted state. |

**Steps to reproduce:**
1. Edit or delete any group.
2. It appears in Approval Requests (no status badge at all, just Reject/Approve buttons).
3. Approve or reject the request.
4. The item disappears completely from the list; the tab goes back to "All caught up" — there is no historical record of who approved/rejected it, when, or why.

---

### BUG-03 — Request reason is not required when editing, despite being documented as mandatory

| Field | Detail |
|---|---|
| Severity | Medium |
| Test Cases | TC-AG-030 |
| Cause | The edit form's validation schema does not mark the field as required (unlike Deactivate/Delete, where it does block submission). |

**Steps to reproduce:**
1. Edit any Approved group, change the Name.
2. Leave "Request reason" empty.
3. Click "Submit for Approval".
4. It submits successfully (toast "Submitted for approval.") — with no validation error at all.

---

### BUG-04 — Approval Request cards show no action badges or field diff; Approve has no dialog

| Field | Detail |
|---|---|
| Severity | Medium |
| Test Cases | TC-AG-071, TC-AG-072, TC-AG-076, TC-AG-079 |
| Cause | A single generic card template is reused for all 4 request types, with no diff/badge logic; Approve was implemented as a direct action instead of opening the same dialog Reject uses. |

**Steps to reproduce:**
1. Edit a group changing Name + Discount %, with a reason.
2. In Approval Requests, the card shows the PROPOSED name as its title and the proposed values flat — with no row like "Name: X → Y".
3. Click "Approve" on any card.
4. It resolves instantly, with no confirmation dialog.

---

### BUG-05 — Discount % is not normalized to 2 decimals; the list rounds to a whole number

| Field | Detail |
|---|---|
| Severity | Medium |
| Test Cases | TC-AG-087 |
| Cause | The list column uses `Math.round` instead of `toFixed(2)`; the form does not normalize the raw value on save. |

**Steps to reproduce:**
1. Create a group with Discount % = 12.5.
2. It is created successfully.
3. The list shows "13%" instead of "12.50%"; the edit form shows "12.5", not "12.50".

---

### BUG-06 — Filters panel has no Status filter; lost the Approval filter after the redeploy

| Field | Detail |
|---|---|
| Severity | Medium |
| Test Cases | TC-AG-010, TC-AG-011, TC-AG-096 |
| Cause | The filters component was built for a fixed subset of fields and was never extended to Status. |

**Steps to reproduce:**
1. Go to the Affinity Groups list.
2. Click "Filters".
3. Only "Subscription type" and "Country" appear — no "Approval" or "Status".

---

### BUG-07 — Self-approval not prevented in the UI

| Field | Detail |
|---|---|
| Severity | Medium |
| Test Cases | TC-AG-092 |
| Cause | There is no server-side (or client-side) validation of who is allowed to approve a request. |

**Steps to reproduce:**
1. Edit a group → Submit for Approval.
2. Go to Approval Requests.
3. The Approve/Reject buttons for that same request are enabled for the same user who created it.

---

### BUG-08 — Validation messages show raw, untranslated i18n keys

| Field | Detail |
|---|---|
| Severity | Low |
| Test Cases | TC-AG-022, TC-AG-024, TC-AG-026 |
| Cause | Translation entries are missing for the `required`/`invalidFormat` keys in the loaded language bundle. |

**Steps to reproduce:**
1. Leave Name empty (or 1 character) → the error literally shows `validation.required`.
2. Code = "CO RP!" → the error literally shows `validation.invalidFormat`.
3. Empty Discount % → the error shows `validation.required`.

---

### BUG-09 — Column sorting in the list is not implemented

| Field | Detail |
|---|---|
| Severity | Low |
| Test Cases | TC-AG-082 |
| Cause | The table component does not implement sorting. |

**Steps to reproduce:**
1. Click the "Name" column header in the list.
2. Row order stays exactly the same (insertion order), with no arrow or visual indicator.
