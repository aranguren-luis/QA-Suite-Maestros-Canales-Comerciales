<h1 align="center">Independent QA Audit Report<br>Cobranza &amp; KPI — Affinity Groups Module</h1>

<table style="width:100%; border-collapse:collapse; margin:1.5em 0; font-size:0.95em;">
<tr style="border-top:2px solid #333; border-bottom:1px solid #ddd;">
  <td style="padding:10px 14px; font-weight:600; width:220px; background:#f6f7f9; vertical-align:top;">Document type</td>
  <td style="padding:10px 14px;">Test Summary Report (IEEE 829) — <strong>living document</strong>, not a Test Plan nor a closure certification</td>
</tr>
<tr style="border-bottom:1px solid #ddd;">
  <td style="padding:10px 14px; font-weight:600; width:220px; background:#f6f7f9; vertical-align:top;">Project</td>
  <td style="padding:10px 14px;">Cobranza &amp; KPI (product acquired by the client company from an external vendor) — <strong>Affinity Groups</strong> module (first module delivered, out of 23 modules confirmed in the UI)</td>
</tr>
<tr style="border-bottom:1px solid #ddd;">
  <td style="padding:10px 14px; font-weight:600; background:#f6f7f9; vertical-align:top;">Repositories</td>
  <td style="padding:10px 14px;">Frontend, gateway/orchestration, identity, and master-data repositories (vendor's source code, cloned) — backend not yet stood up</td>
</tr>
<tr style="border-bottom:1px solid #ddd;">
  <td style="padding:10px 14px; font-weight:600; background:#f6f7f9; vertical-align:top;">Environment under test</td>
  <td style="padding:10px 14px;">Demo portal (URL configured via <code>BASE_URL</code>) — the final frontend has not been deployed to the cloud yet. Confirmed: the demo is a 100% client-side mock, <strong>with no real backend</strong> (0 network calls, seed data embedded in the JS bundle) — see the troubleshooting note.</td>
</tr>
<tr style="border-bottom:1px solid #ddd;">
  <td style="padding:10px 14px; font-weight:600; background:#f6f7f9; vertical-align:top;">QA Owner</td>
  <td style="padding:10px 14px;">Luis Aranguren</td>
</tr>
<tr style="border-bottom:1px solid #ddd;">
  <td style="padding:10px 14px; font-weight:600; background:#f6f7f9; vertical-align:top;">Tool</td>
  <td style="padding:10px 14px;">Playwright (real browser, not API) — suite <code>.qa/tests/affinity-groups-ui.spec.ts</code>, run with <code>bun</code></td>
</tr>
<tr style="border-bottom:1px solid #ddd;">
  <td style="padding:10px 14px; font-weight:600; background:#f6f7f9; vertical-align:top;">QA Methodology</td>
  <td style="padding:10px 14px;">Black box — each case is first verified live against the demo (Playwright MCP) and, if the actual result matches the expected one, it is immediately automated in the Playwright suite. Cycle in batches of 10 cases.</td>
</tr>
<tr style="border-bottom:2px solid #333;">
  <td style="padding:10px 14px; font-weight:600; background:#f6f7f9; vertical-align:top;">Origin of the test cases</td>
  <td style="padding:10px 14px;">141 cases documented by an external vendor (100 UI + 41 API), self-reported as "Pass" except for 13 "Under Development". This audit independently verifies that "Pass", case by case.</td>
</tr>
</table>

---

## 1. Executive Summary

### 1.1 Introduction

This report records the progress of the independent QA audit of the **Affinity Groups** module of the Cobranza & KPI product, verifying case by case the 100 UI test cases and 41 API test cases documented by vendor. **This is a living document**: it is updated after every batch of 10 cases executed; it is not a closure/certification report.

### 1.2 Scope covered so far

- **TC-AG-001 through TC-AG-100 (100 of 100 vendor UI cases)** — verified live against the demo and automated. **UI batch complete.**
- Pending: TC-AG-001 through TC-AG-041 (API, requires the real backend to be stood up), and the remaining 22 of the 23 UI modules outside Affinity Groups (no vendor documentation available yet).

### 1.3 Current status

**Not certified — UI batch complete, pending re-verification against the real backend.** Of the 100 cases verified, 47 confirm the vendor's "Pass" without caveats (including TC-AG-095 and TC-AG-100, corrected/reconfirmed on 2026-10-02), 19 are **not reproducible** on this demo (the 15 already documented in the previous batch, plus TC-AG-091 for being purely API, TC-AG-094 for requiring an invalid state to be forced via the backend, and TC-AG-097/098/099 for lack of a permission system and a second user/role), and **32 cases have confirmed discrepancies** against the documentation (the 30 from the previous batch, plus TC-AG-092 and TC-AG-096 — note: TC-AG-095 was withdrawn as a discrepancy after the 2026-10-02 correction, see HALLAZGO-012), found only against the demo (no real backend) — pending re-verification against the real backend (the master-data backend repo) before escalating them as definitive product bugs.

> **Correction 2026-10-01:** TC-AG-080 (Pending badge tooltip) had initially been logged as a discrepancy due to a targeting error in manual verification (hovering over the containing cell instead of the exact badge). On re-verifying with screenshot evidence, the tooltip documented by the vendor **does exist and works correctly** — the discrepancy is retracted and recounted as a confirmed "Pass". See detail in the HALLAZGO-008 note.

---

## 2. Results Matrix by Section

| # | Section (vendor cases) | Cases verified | Confirmed without caveats | With discrepancy | Findings |
|---|---|:---:|:---:|:---:|---|
| 2.1 | TC-AG-001 to TC-AG-010 — Navigation, Approval Requests, list, basic filters | 10 | 10 | 0 | — |
| 2.2 | TC-AG-011 to TC-AG-020 — Combined filters, badges, Status column, pagination, creation | 10 | 8 | 1 case (TC-AG-013) | HALLAZGO-001, HALLAZGO-002 |
| 2.3 | TC-AG-021 to TC-AG-030 — Successful creation, form validations (Name/Code/Discount/Country), duplicates, edit | 10 | 7 | 3 cases (TC-AG-022, TC-AG-024, TC-AG-026 share HALLAZGO-003; TC-AG-030 is HALLAZGO-004) | HALLAZGO-003, HALLAZGO-004 |
| 2.4 | TC-AG-031 to TC-AG-040 — Cancel, deferred Deactivate/Activate, status change, Retire/Delete | 10 | 4 (+2 not reproducible) | 4 cases (TC-AG-032/033/034/035 share the expanded HALLAZGO-001; TC-AG-036 is HALLAZGO-005; TC-AG-039 reconfirms HALLAZGO-002) | HALLAZGO-001 (expanded), HALLAZGO-002 (reconfirmed), HALLAZGO-005 |
| 2.5 | TC-AG-041 to TC-AG-050 — Unblocked retirement, approve/reject requests, row structure, audit trail | 10 | 4 (+1 not reproducible) | 5 cases (TC-AG-044 partial due to HALLAZGO-001; TC-AG-046/047/048/050 share HALLAZGO-006) | HALLAZGO-006 (new) |
| 2.6 | TC-AG-051 to TC-AG-060 — Status badges, dual visibility, status filter, empty state, permissions (3 vendor "Under Development") | 10 | 0 | 5 cases (TC-AG-052/053/055/056/057, all a consequence of HALLAZGO-006) (+5 not reproducible: TC-AG-051, 054, 058, 059, 060) | HALLAZGO-006 (expanded) |
| 2.7 | TC-AG-061 to TC-AG-070 — Duplicate prevention (Rule 4), permissions (2 "Under Development"), error handling, concurrency, i18n | 10 | 4 | 2 cases (TC-AG-061/063 share the new HALLAZGO-007) (+4 not reproducible: TC-AG-062, 066, 067, 069) | HALLAZGO-007 (new) |
| 2.8 | TC-AG-071 to TC-AG-080 — Action badges, field diff, card title, Deactivate/Retire/Approve/Reject dialogs, Pending tooltip | 10 | 5 | 4 cases (TC-AG-071/072/076/079 share the new HALLAZGO-008; TC-AG-080 retracted on 2026-10-01 — confirms documented behavior) (+1 not reproducible: TC-AG-075 due to HALLAZGO-006) | HALLAZGO-008 (new) |
| 2.9 | TC-AG-081 to TC-AG-090 — Read-only mode (pending/retired), column sorting, Edit dirty-check, Name uniqueness, value persistence after Reject, resubmission after rejection, Discount % limits, Subscription Type/Country dropdowns, API lookup | 10 | 1 | 7 cases (TC-AG-081/083/084/085 share the new HALLAZGO-009; TC-AG-082 is the new HALLAZGO-010; TC-AG-086 extends HALLAZGO-008; TC-AG-087 is the new HALLAZGO-011) (+2 not reproducible: TC-AG-089 due to insufficient data, TC-AG-090 for being purely API) | HALLAZGO-009, HALLAZGO-010, HALLAZGO-011 (new) |
| 2.10 | TC-AG-091 to TC-AG-100 — API guards, self-approval, Reject reason, rollback, Request Type filter, Status filter, permissions (3 vendor "Under Development"), 375px responsive | 10 | 2 (TC-AG-095 and TC-AG-100, after the 2026-10-02 correction) | 2 cases (TC-AG-092 is the new HALLAZGO-013; TC-AG-096 extends HALLAZGO-012) (+2 not reproducible: TC-AG-091 for being purely API; TC-AG-094 for requiring an invalid state to be forced via the backend; +1 combined not-reproducible: TC-AG-097/098/099 due to lack of permissions) | HALLAZGO-012 (expanded), HALLAZGO-013 (new) |
| — | **Total verified** | **100** | **47** (+19 not reproducible) | **32** | 13 findings |

**Automation:** suite `affinity-groups-ui.spec.ts` — **92/92 tests pass** (UI batch complete, TC-AG-001 through TC-AG-100; TC-AG-034/035, TC-AG-058/059/060, TC-AG-066/067 and TC-AG-097/098/099 each share one test; TC-AG-074 is verified within the TC-AG-071/072 tests; TC-AG-075 has no test of its own since it is not reproducible; the latest run is logged in section 4).

---

## 3. Findings Register

### HALLAZGO-001 — Deactivate/Activate apply the Status change immediately, bypassing Approval Requests

| Field | Detail |
|-------|---------|
| **ID** | HALLAZGO-001 (cases TC-AG-013, TC-AG-032, TC-AG-033, all documented "Pass" by the vendor) |
| **Title** | The "Deactivate" and "Activate" actions change `Status` immediately (`Active↔Inactive`), bypassing the approval queue (maker-checker) |
| **Severity** | Medium — contradicts the very text of both confirmation dialogs ("The record stays active/inactive until an approver signs off") and the maker-checker pattern that Edit and Delete do respect |
| **Cause** | Not determined in code — the demo makes no network calls (mock embedded in the bundle), and the current checkout of the frontend repo does not expose the simulation logic the deployed demo uses. Hypothesis: the mock's "deactivate"/"activate" handlers update `status` directly instead of creating an `ApprovalRequestRecord`. |
| **Reproduction** | Click "Deactivate" (or "Activate") on any row → fill in a reason → "Submit for Approval" → the row returns to the list with `Status` already flipped immediately; the request never appears in "Approval Requests" (it stays "All caught up"). |
| **Consequence** | TC-AG-034 (approving a pending status change) and TC-AG-035 (rejecting it) are **not reproducible**: a status-change request to act on never exists. |
| **Evidence** | Automated tests: `affinity-groups-ui.spec.ts` → `TC-AG-013`, `TC-AG-032`, `TC-AG-033`, `TC-AG-034 y TC-AG-035`. |
| **Status** | **Confirmed against the demo only** — pending re-verification against the master-data backend repo (real backend, not yet stood up) before reporting to the vendor as a product bug. |

---

### HALLAZGO-002 — Approving a deletion erases the record instead of marking it "Retired"

| Field | Detail |
|-------|---------|
| **ID** | HALLAZGO-002 (cases TC-AG-013, TC-AG-039, documented "Pass" by the vendor) |
| **Title** | On approving a "Deletion requested" request, the record disappears entirely from the list (hard delete) instead of ending up visibly `Status=Retired` |
| **Severity** | Medium — the "Retired" state documented by the vendor (*"retired groups remain listed"*) is never reachable on this demo; the Delete dialog itself already anticipates it ("Once approved, it will be removed") |
| **Cause** | Not determined in code, same limitation as HALLAZGO-001 (the demo's mock is not locatable 1:1 in the repo's current checkout). Hypothesis: the "approve deletion" handler removes the record from the in-memory array instead of marking it `retired`. |
| **Reproduction** | Delete on any row → Approval Requests → Approve → the record no longer appears in the list; no `Status=Retired` is ever visible. Reconfirmed 2026-09-30 with a second record (EXONERATED → CORPORATE, TC-AG-039). |
| **Evidence** | Automated tests: `affinity-groups-ui.spec.ts` → `TC-AG-013`, `TC-AG-039`. |
| **Status** | **Confirmed against the demo only** — pending re-verification against the real backend. |

---

### HALLAZGO-005 — The row's button is labeled "Delete", not "Retire" as documented by the vendor

| Field | Detail |
|-------|---------|
| **ID** | HALLAZGO-005 (case TC-AG-036, documented "Pass" by the vendor) |
| **Title** | The row's destructive action is labeled "Delete" (and the dialogs use "deletion"/"removed" language); the vendor documents that it should be called "Retire" and that a plain "Delete" should not exist |
| **Severity** | Low — this is a terminology finding, not a behavioral one; the underlying behavior (stays "Pending deletion" until approved) does match TC-AG-038/040 |
| **Cause** | Not determined in code (same non-locatable-mock limitation). |
| **Reproduction** | Inspect the action buttons on any row: "Edit", "Deactivate", "Delete" — no button/icon says "Retire". |
| **Evidence** | Automated test: `affinity-groups-ui.spec.ts` → `TC-AG-036`. |
| **Status** | **Confirmed against the demo only.** Together with HALLAZGO-002, it suggests the whole "Retire" (soft-delete) concept was never implemented for this module. |

---

### HALLAZGO-003 — Validation messages show raw, untranslated i18n keys

| Field | Detail |
|-------|---------|
| **ID** | HALLAZGO-003 (cases TC-AG-022, TC-AG-024, TC-AG-026, all 3 documented "Pass" by the vendor) |
| **Title** | Some validation errors on the creation form show the raw i18n key (`validation.required`, `validation.invalidFormat`) instead of readable text; other errors on the same form do show resolved text ("Invalid input") |
| **Severity** | Low — validation works (the form does not submit), the defect is in the quality of the message shown to the user |
| **Cause** | Not determined in code (same limitation: the demo's mock is not locatable 1:1 in the current checkout). Hypothesis: translation entries are missing for the `required`/`invalidFormat` keys in the loaded language bundle. |
| **Reproduction** | Leave Name empty or with 1 character → error literally shows `validation.required`. Code = "CO RP!" → error literally shows `validation.invalidFormat`. Empty Discount % → error shows `validation.required`. (Name with 61 characters and Discount 150/-5 do show "Invalid input" correctly.) |
| **Evidence** | Automated tests: `affinity-groups-ui.spec.ts` → `TC-AG-022`, `TC-AG-024`, `TC-AG-026` (verify the functional rejection, not the message text). |
| **Status** | **Confirmed against the demo only** — pending re-verification against the final frontend once deployed. |

---

### HALLAZGO-004 — The change reason (Request reason) is not required when editing, despite being documented as mandatory

| Field | Detail |
|-------|---------|
| **ID** | HALLAZGO-004 (case TC-AG-030, documented "Pass" by the vendor) |
| **Title** | Editing an affinity group and leaving "Request reason" empty does not block submission — the edit is submitted for approval successfully with no validation error at all |
| **Severity** | Medium — directly contradicts the documentation ("the Request reason is REQUIRED... the edit is not submitted"); this is the second time a reason field documented as mandatory turns out not to be enforced in practice (the first was the approver's note on Reject, UC-07) |
| **Cause** | Not determined in code (same non-locatable-mock limitation). Hypothesis: the edit form's validation schema does not mark `changeReason` as required, unlike Deactivate/Delete, where the reason field does block submission (visible `*` asterisk and active aria-invalid while empty). |
| **Reproduction** | Edit any Approved group, change the Name, leave Request reason empty, click "Submit for Approval" → submits successfully (toast "Submitted for approval.", record moves to Pending). |
| **Evidence** | Automated test: `affinity-groups-ui.spec.ts` → `TC-AG-030`. |
| **Status** | **Confirmed against the demo only** — pending re-verification against the real backend. |

---

### HALLAZGO-006 — Approval Requests is not an audit trail: resolved requests disappear instead of remaining visible

| Field | Detail |
|-------|---------|
| **ID** | HALLAZGO-006 (cases TC-AG-046, 047, 048, 050, 052, 053, 055, 056, 057 — 9 in total, all documented "Pass" by the vendor except 056) |
| **Title** | As soon as a request is Approved or Rejected, it disappears entirely from the Approval Requests tab — no historical record remains with an "Approved"/"Rejected" badge, reason, reviewer, or date. There are also no visual status badges (not even for Pending) and no status filter. |
| **Severity** | **High** — unlike this module's other findings, this one affects traceability/auditing as a whole, not a single flow. **9 distinct vendor test cases** (046/047/048/050/052/053/055/056/057) describe this tab as a complete audit trail with badges and filters — none of it holds up. |
| **Cause** | Not determined in code (same non-locatable-mock limitation). Hypothesis: the mock's "pending requests" store behaves like a queue (the item is removed once resolved) instead of a log with a persisted status field; which is also why there is never a status badge to render or a status filter to implement. |
| **Reproduction** | Edit/delete any group → it appears in Approval Requests (with no text badge at all, just Reject/Approve buttons) → Approve (or Reject with a reason) → the item disappears from the list as soon as it is resolved; the tab goes back to "All caught up" even though something was just successfully resolved moments earlier. Only a "Request type" filter exists, never a status one. |
| **Consequence** | TC-AG-044 (row structure) is only partially verifiable — the documented "status/lifecycle change tag" is never observed because no status change ever reaches the queue (HALLAZGO-001). TC-AG-051 and TC-AG-054 are not reproducible for the same root cause (no badges, statuses never coexist to compare). |
| **Evidence** | Automated tests: `affinity-groups-ui.spec.ts` → `TC-AG-046` through `TC-AG-048`, `TC-AG-050`, `TC-AG-052`, `TC-AG-053`, `TC-AG-055` through `TC-AG-057`. |
| **Status** | **Confirmed against the demo only** — pending re-verification against the real backend before reporting to the vendor. This is the most critical observation in the whole module so far: without this, there is no way to reconstruct who approved/rejected what and when. |

---

### HALLAZGO-007 — A second request (e.g. Delete) silently overwrites the pending one (e.g. Edit) instead of being blocked

| Field | Detail |
|-------|---------|
| **ID** | HALLAZGO-007 (cases TC-AG-061, TC-AG-063, documented "Pass" by the vendor) |
| **Title** | The "duplicate prevention" guard (Rule 4) only partially protects Edit (via the read-only form, not a disabled button); Deactivate and Delete are not protected — submitting them while another request is already pending for the same group **silently replaces** the original request with no block or warning |
| **Severity** | **High** — this is silent loss of governance data: the first request (with its own reason) disappears without a trace or notifying whoever submitted it, in a module whose explicit purpose is traceability of changes to "segmentation masters" |
| **Cause** | Not determined in code (same non-locatable-mock limitation). Hypothesis: the mock stores a single reference to "the active request" per `groupId` instead of a list — the second request overwrites that reference instead of being rejected. |
| **Reproduction** | Edit CORPORATE (becomes Pending) → without resolving that request, click "Delete" on CORPORATE → confirm → the record moves to "Pending deletion"; the original edit request disappears without a trace and the Approval Requests badge never goes above 1. |
| **Evidence** | Automated tests: `affinity-groups-ui.spec.ts` → `TC-AG-061`, `TC-AG-063`. |
| **Status** | **Confirmed against the demo only** — pending re-verification against the real backend before reporting to the vendor. |

---

### HALLAZGO-008 — Approval Request cards show no action badges or field diff; Approve does not open a dialog

| Field | Detail |
|-------|---------|
| **ID** | HALLAZGO-008 (cases TC-AG-071, 072, 076, 079 — 4 in total, all documented "Pass" by the vendor) |
| **Title** | Request cards do not distinguish the action type (no CREATE/EDIT badge), show no field diff on edits, an edit's card title uses the PROPOSED name instead of the current one, and "Approve" resolves with no confirmation/comment dialog at all |
| **Severity** | Medium — it is not data loss and does not break the audit trail (that is already covered by HALLAZGO-006/007), but it leaves the review UI noticeably poorer: a real reviewer cannot see exactly what changed before approving an edit |
| **Cause** | Not determined in code (same non-locatable-mock limitation). Hypothesis: a single generic card template is reused for all 4 request types with no diff/badge logic, and Approve was implemented as a direct one-click action instead of opening the same dialog Reject does use. |
| **Reproduction** | Edit CORPORATE (Name + Discount %, with a reason) → in Approval Requests the card shows the PROPOSED name as its title and the proposed values flat, with no row like "Name: CORPORATE → CORPORATE RENAMED". Click "Approve" on any card → it resolves instantly with no dialog. |
| **Evidence** | Automated tests: `affinity-groups-ui.spec.ts` → `TC-AG-071`, `TC-AG-072`, `TC-AG-076`, `TC-AG-079`. |
| **Status** | **Confirmed against the demo only** — pending re-verification against the real backend before reporting to the vendor. **Note:** TC-AG-080 (Pending badge tooltip) was originally included in this finding but was **retracted on 2026-10-01** after confirming with a screenshot that the tooltip does work — the original finding was a false positive from imprecise hovering during manual verification (see detail in the vault note). |

---

### HALLAZGO-009 — Edit does not respect the approval flow: proposed values are applied immediately and persist after Reject; no dirty-check or Name uniqueness

| Field | Detail |
|-------|---------|
| **ID** | HALLAZGO-009 (cases TC-AG-081 partial, 083, 084, 085 — all documented "Pass" by the vendor) |
| **Title** | The Edit form has no real change guard (Request reason/Submit are enabled from the start, an edit with no change at all still submits), the Name field does not validate uniqueness (neither exact nor case-insensitive), and an edit's proposed values already show in the list while it is Pending — and **persist even after an explicit Reject**, instead of reverting to the current value |
| **Severity** | High — this is the highest-impact data-integrity finding so far: a reviewer who rejects a change does not actually manage to discard it, the "rejected" data stays visually applied in the mock |
| **Cause** | Not determined in code (demo with no real backend). Hypothesis: the mock applies the form's PATCH directly to the in-memory record at submit time (optimistic update with no rollback); neither Approve nor Reject reconcile against the actually current value. |
| **Reproduction** | Edit an Approved group (e.g. "Grupo QA 071") changing Discount % with a reason → Submit → the list already shows the proposed value with Approval=Pending → Reject the request → the list keeps the proposed value with Approval=Rejected (does not revert). Separately: create a group with a Name identical to an existing one (different capitalization) → it is created with no error. |
| **Evidence** | Automated tests: `affinity-groups-ui.spec.ts` → `TC-AG-081`, `TC-AG-083`, `TC-AG-084`, `TC-AG-085`. |
| **Status** | **Confirmed against the demo only** — pending re-verification against the real backend before reporting to the vendor. High-priority re-verification alongside HALLAZGO-006/007. |

---

### HALLAZGO-010 — Column sorting in the list is not implemented

| Field | Detail |
|-------|---------|
| **ID** | HALLAZGO-010 (case TC-AG-082, documented "Pass") |
| **Title** | Clicking the column headers (Name, Code, Subscription type, Discount %, Approval, Status) does not change row order or show any visual indicator |
| **Severity** | Low — convenience functionality, does not block any transactional flow |
| **Cause** | Not determined — the mock's table component does not implement sorting at all. |
| **Reproduction** | Click the "Name" header in the list → row order stays exactly the same (seed insertion order), with no arrow/indicator. |
| **Evidence** | Automated test: `affinity-groups-ui.spec.ts` → `TC-AG-082`. |
| **Status** | **Confirmed against the demo only** — pending re-verification against the real backend before reporting to the vendor. |

---

### HALLAZGO-011 — Discount % is not normalized to 2 decimals; the list rounds to a whole number

| Field | Detail |
|-------|---------|
| **ID** | HALLAZGO-011 (case TC-AG-087, documented "Pass") |
| **Title** | A valid value with decimals (e.g. 12.5) is not normalized to 2 decimals on the form, and the main list's Discount % column rounds it to the nearest whole number (13%) instead of showing the value precisely |
| **Severity** | Medium — not data loss, but it creates a real risk of commercial/financial misunderstanding if the fractional value is never shown correctly in the grid. Out-of-range values (>100, <0) or values with 3 decimals are blocked on submit, but with no visible error message at all (silent failure). |
| **Cause** | Not determined — hypothesis: the column uses a whole-number formatter (`Math.round`) instead of `toFixed(2)`, and the form does not normalize the raw input value on save. |
| **Reproduction** | Create a group with Discount % = 12.5 → it is created successfully → the list shows "13%" instead of "12.50%"; the edit form shows "12.5", not "12.50". Try 150, -5, or 12.345 → submission is blocked with no error message. |
| **Evidence** | Automated test: `affinity-groups-ui.spec.ts` → `TC-AG-087`. |
| **Status** | **Confirmed against the demo only** — pending re-verification against the real backend before reporting to the vendor. |

---

### HALLAZGO-012 — The Filters panel never had a Status filter, and lost the Approval one after the redeploy

| Field | Detail |
|-------|---------|
| **ID** | HALLAZGO-012 (cases TC-AG-010, TC-AG-011, TC-AG-096, documented "Pass") |
| **Title** | The main list's "Filters" panel only offers Subscription type and Country — it never had a Status filter (Active/Inactive/Retired), and the Approval filter (Pending/Approved) that did exist disappeared after the 2026-10-01 redeploy |
| **Severity** | Medium — does not block any transactional flow, but limits the auditing/search capability documented by the vendor for this module. |
| **Cause** | Not determined in code — demo with no real backend. Hypothesis: the filters component was built for a fixed subset of fields and was never extended to Status. |
| **Reproduction** | Affinity Groups list → click "Filters" → only "Subscription type" and "Country" appear, with no "Approval" or "Status". |
| **Correction 2026-10-02:** this finding originally also included the Approval Requests "Request type" combobox (TC-AG-095), under the hypothesis that it only statically offered "Edit". On re-verifying by creating a **Deactivate** request instead of an Edit one, the combobox showed "Deactivate" (not "Edit") — confirming that this filter **is populated dynamically based on the existing pending requests**, which is correct behavior. That part of the finding is withdrawn; only the Filters panel (Subscription type/Country/no Status/no Approval) remains valid. |
| **Evidence** | Automated tests: `affinity-groups-ui.spec.ts` → `TC-AG-010`, `TC-AG-011`, `TC-AG-096`. |
| **Status** | **Confirmed against the demo only** — pending re-verification against the real backend before reporting to the vendor. |

---

### HALLAZGO-013 — Self-approval not prevented in the UI

| Field | Detail |
|-------|---------|
| **ID** | HALLAZGO-013 (case TC-AG-092, documented "Pass") |
| **Title** | The Approve/Reject controls for a request created by the current user are never hidden or disabled — the same user can approve their own change (maker-checker segregation of duties not enforced by the UI) |
| **Severity** | Medium — internal-control risk (a single user can both propose and approve the same change), though on this demo it is not verifiable with a real second user/role. |
| **Cause** | Not determined — demo with a single user/session ("Demo User"), with no backend to validate server-side who can approve. |
| **Reproduction** | Edit a group → Submit for Approval → go to Approval Requests → the Approve/Reject buttons for that same request are enabled for the same user who created it. |
| **Evidence** | Automated test: `affinity-groups-ui.spec.ts` → `TC-AG-092`. |
| **Status** | **Confirmed against the demo only** — pending re-verification against the real backend before reporting to the vendor. |

---

### Minor discrepancies (not elevated to a formal finding)

- **UC-07 vs. the actual Reject dialog:** the use case documents the approver's note as mandatory when rejecting; the actual dialog marks it "(optional)" and the reject completes with the field empty. Same pattern as HALLAZGO-004 (a reason field documented as mandatory, not enforced in practice). **Reconfirmed 2026-10-01 by TC-AG-093** (third case with the same pattern) — kept as a minor discrepancy rather than elevated to a new formal finding, since it is the same pattern already covered by HALLAZGO-004.
- **Discount % with decimals is rounded in the list column:** creating a group with `12.5%`, the list shows it as `13%`. The vendor's TC-AG-014 case only documents the whole-number format (e.g. "15%"), so this is not elevated to a discrepancy — it remains an observation.
- **TC-AG-027 (Country required):** confirmed as "Pass", but structurally — the combobox always carries a default value (Venezuela) and only offers 3 valid options (VE/DO/PE), never an empty/invalid state. There is no active validation rule that can be triggered; the requirement is met because the UI does not allow otherwise.
- **TC-AG-045 (segregation of duties):** confirmed as "Pass" regarding "editing resubmits to Pending", but the assertion that "the creator cannot self-approve" is not verifiable — the demo has a single user/session ("Demo User"), with no viewer role or second user (see also TC-AG-049, not reproducible for the same reason). See also HALLAZGO-013 (TC-AG-092), which formalizes this same point.
- **TC-AG-088 (Subscription Type offers only active values):** confirmed "Pass" for the UI part (the dropdown only offers Prepaid/Postpaid/Hybrid, matching the documentation); the API part (rejecting an inactive value/random UUID via a direct POST) is not reproducible without a real backend.
- **TC-AG-089 (Country selector with search and pagination):** the demo only has 3 seeded countries (VE/DO/PE) — insufficient to exercise the documented scroll/pagination (same data limitation already seen in TC-AG-015). The API part (rejecting an unknown country) is also not reproducible without a real backend.
- **TC-AG-095 (Request Type filter):** confirmed "Pass" — see the correction under HALLAZGO-012: the combobox populates dynamically based on existing pending requests, it is not an incomplete static list.
- **TC-AG-100 (375px responsive):** confirmed "Pass" for the absence of horizontal scroll — partial verification; a full accessibility audit (axe) or keyboard navigation audit was not run in this batch.

---

## 4. Automation Runs

| Date | Command | Result | Notes |
|---|---|---|---|
| 2026-09-30 | `bunx playwright test --config ./config/playwright.config.ts` | **20/20 passed** (2.3 min) | TC-AG-001 to TC-AG-020. 2 locator-fix iterations before the green run. |
| 2026-09-30 | `bunx playwright test --config ./config/playwright.config.ts` | **30/30 passed** (3.8 min) | TC-AG-021 to TC-AG-030 added. 3 fix iterations (row count in TC-AG-026, toast blocking the click in TC-AG-028 — resolved by submitting the form with Enter instead of a click). |
| 2026-09-30 | `bunx playwright test --config ./config/playwright.config.ts` | **39/39 passed** (4.9 min) | TC-AG-031 to TC-AG-040 added (TC-AG-034/035 share one test). 0 fix iterations — every locator worked on the first try. |
| 2026-10-01 | `bunx playwright test --config ./config/playwright.config.ts` | **49/49 passed** (8.6 min) | TC-AG-041 to TC-AG-050 added. 2 fix iterations (ambiguous text in TC-AG-047, two simultaneous "Approve"/"Reject" buttons in TC-AG-050 — resolved with `.first()`). |
| 2026-10-01 | `bunx playwright test --config ./config/playwright.config.ts` | **59/59 passed** (12.4 min + 1 re-run) | TC-AG-051 to TC-AG-060 added (TC-AG-058/059/060 share one test). 2 fix iterations ("Request type" locator had no accessible name of its own — resolved with `.filter({hasText})`; the type filter only appears with at least 1 request, a seed was added). 1 transient flake in TC-AG-034/035 (login timeout in `beforeEach`, unrelated to logic) — confirmed as a flake by re-running alone, passes clean. |
| 2026-10-01 | `bunx playwright test --config ./config/playwright.config.ts` | **66/66 passed** (8.7 min + 8.8 min) | TC-AG-061 to TC-AG-070 added. 1 fix iteration ("Cancelar" is a link, not a button, in the Spanish view). First run gave 65/65 — it was found that TC-AG-066/067 had been left without their own test; one combined test was added (same pattern as TC-AG-058/059/060) and the second run confirmed 66/66. |
| 2026-10-01 | `bunx playwright test --config ./config/playwright.config.ts` | **74/74 passed** (9.8 min) | TC-AG-071 to TC-AG-080 added (8 new tests: TC-AG-071, 072, 073, 076, 077, 078, 079, 080 — TC-AG-074 is covered by assertions inside TC-AG-072/073, TC-AG-075 has no test of its own since it is not reproducible). 1 fix iteration (TC-AG-079: after Approve the view stays on Approval Requests, not the main list — explicit navigation back was added before looking up the CORPORATE row for the Reject part of the same test). |
| 2026-10-01 | `bunx playwright test --config ./config/playwright.config.ts` | **55/84 passed, 29 failed** (initial run) | TC-AG-081 to TC-AG-090 added (10 new tests). 1 correction applied: TC-AG-080 (previous batch) was written incorrectly — it asserted the absence of a tooltip that actually exists (false negative from imprecise hovering over the containing cell instead of the exact badge); corrected to assert its presence, confirmed with an actual screenshot. **⚠ The 29 failures were NOT test errors**: it was confirmed that the demo had been redeployed with a different version during this session ("Delete"→"Retire" button, the Approval column now shows "-", the "Approval" filter disappeared from the Filters panel, row-selection checkboxes appeared). See the internal troubleshooting note about the 2026-10-01 demo redeploy. |
| 2026-10-01 | `bunx playwright test --config ./config/playwright.config.ts` | **84/84 passed** (correction run, after re-auditing) | Re-verified live against the new demo version: HALLAZGO-001/002/005/006/007/008/009: **HALLAZGO-001, 002 and 005 turned out RESOLVED** (Deactivate/Activate now go through Pending→Approve; Retire marks Status=Retired and keeps the record; the button is now called "Retire"); **HALLAZGO-007 turned out RESOLVED** (all 3 actions are genuinely disabled with a pending request, except Edit, which stays enabled when the pending type is Edit itself); **HALLAZGO-006, 008 (partial), and 009 remain confirmed with no changes**. ~15 tests were rewritten to reflect the new behavior and 2 locators were fixed (`/^EMPLOYEE/`, `/^CORPORATE DUPNAME/`) that broke due to the new row-selection checkbox column (it changes each row's accessible name). Additional minor finding: disabled actions now show a tooltip (did not exist before), but with different text than the vendor documents. |
| 2026-10-02 | `bunx playwright test --config ./config/playwright.config.ts` | **88/92 passed, 4 failed** (initial run of the final batch) | TC-AG-091 to TC-AG-100 added (8 new tests, 92 total). 4 failures — all in previous-batch tests (not the new ones), from accumulated drift: TC-AG-047 (the "CORPORATE approved." toast still visible when checking for its absence — a race condition), TC-AG-096 (`getByText('Subscription type')` ambiguous: matches both the filter label and the table column), TC-AG-100 (at 375px the "Masters" navigation button is hidden/collapsed, breaking the `openAffinityGroups` helper), and **TC-AG-095 revealed an earlier theory to be incorrect** (see HALLAZGO-012). |
| 2026-10-02 | `bunx playwright test --config ./config/playwright.config.ts` | **92/92 passed** (correction run — **UI batch complete**) | The 4 failures fixed: TC-AG-047 now explicitly waits for the toast to appear and disappear before checking for its absence; TC-AG-096 uses `page.locator('label').filter(...)` instead of `getByText` to avoid the ambiguity with the table column; TC-AG-100 resizes the viewport **after** navigating (not before), avoiding a dependency on responsive navigation; TC-AG-095 was rewritten to assert the Request Type filter's actual dynamic behavior (see the correction under HALLAZGO-012) instead of the static list originally assumed. **100/100 UI cases verified — the Affinity Groups module's UI batch is complete.** |

---

## 5. Outstanding Items to Close This Module

- **UI batch complete (100/100 cases, 92/92 automated tests passing)** — see section 4 for the detail of the final run on 2026-10-02.
- Verify the 41 API cases (`TC-AG-001` to `TC-AG-041`, independent numbering) — requires standing up the backend gateway repo Docker stack (real backend), not yet authorized by the user.
- Re-verify against the real backend before formally reporting to the vendor: **HALLAZGO-006** (audit trail, still valid), **HALLAZGO-008** (partially valid — Edit with no badge/diff), **HALLAZGO-009** (still valid — now the module's highest-severity finding), **HALLAZGO-012** (Filters panel, the Status/Approval part is still valid — the Request Type part was already withdrawn, it was a false positive), **HALLAZGO-013** (self-approval, new), and **HALLAZGO-003/004/010/011** (not yet re-verified against the demo's new version). **HALLAZGO-001, 002, 005, and 007 have already been confirmed RESOLVED** in the demo's new version (2026-10-01) — they do not need to be reported to the vendor as a bug, only confirmed that the fix also reached the real backend.
- **HALLAZGO-009** (Edit with no dirty-check, values persist after Reject) is now the highest-severity (High) unresolved finding — a Reject does not revert the proposed value. HALLAZGO-006 (audit trail, High) follows it in priority. Prioritize its re-verification against the real backend as soon as standing up the Docker stack is authorized.

---

## 6. Report Governance

> Section added after a structural review with the `qai-consultant` MCP (`review_qa_document`, 6-dimension ISTQB/IEEE 829 rubric). The original report covered results and findings in detail but did not explicitly state objectives, in/out scope, risks, entry/exit criteria, or an approval block — real structural gaps, not just a language artifact. Grounded in: `standards/IEEE_829_Test_Documentation.md`, `methodologies/Risk_Based_Testing.md`, `evaluation_audit/Compliance_Audit_Report_Structure.md` (`qai-consultant` KB, citations returned by the 2026-10-06 review).

### 6.1 Objectives

1. Verify, case by case and with reproducible evidence, whether the vendor's self-reported "Pass" for the 100 Affinity Groups UI test cases matches the demo's actual behavior.
2. Produce an automated regression suite (Playwright) that detects whether a future vendor delivery reintroduces or resolves any of the 13 findings on record.
3. Leave a traceable evidence base (screenshots, vault notes, case IDs) sufficient to formally escalate to the vendor whichever findings survive re-verification against the real backend.

### 6.2 Scope

**In scope (features to be tested):**
- The 100 UI test cases documented by the vendor for the Affinity Groups module (`TC-AG-001`–`TC-AG-100`), verified against the `BASE_URL` demo.
- The full maker-checker flow: creation, editing, Deactivate/Activate, Retire/Delete, Approval Requests (approve/reject), filters, and associated form validations.

**Out of scope (features not to be tested, for now):**
- The 41 **API** test cases documented by the vendor (`TC-AG-001`–`TC-AG-041`, numbering independent from the UI) — require the backend gateway repo Docker stack to be stood up, not yet authorized by the user.
- The 22 UI modules outside Affinity Groups (of the 23 confirmed) — no vendor documentation available yet.
- Load/performance testing, formal accessibility (axe), and full keyboard-navigation testing — mentioned only as a partial observation in TC-AG-100, not as an objective of this report.

### 6.3 Approach

Black box, driven by the vendor's documented test cases (not free-form exploratory testing). Each case is first verified live against the demo (Playwright MCP) and, if the actual result matches the expected one, it is immediately automated in the Playwright suite — cycle in batches of 10 cases, with a regression commit/run at the close of each batch (detail in section 4).

### 6.4 Risks and Mitigation

| ID | Risk | Severity | Mitigation / Contingency |
|---|---|---|---|
| R-01 | All 32 findings are confirmed **only against the mock demo** (no real backend); the actual behavior of the master-data backend repo may differ | High | Do not report any finding to the vendor as a definitive bug until re-verified against the real backend (explicit gate in section 5) |
| R-02 | The demo can be redeployed without notice during the audit (already happened on 2026-10-01), invalidating locators and automation baselines | Medium | Dedicated troubleshooting guide (maintained internally); manual re-audit of open findings after each detected redeploy, before trusting a red/green run |
| R-03 | The demo has no second user/role — the 9 cases related to permissions/segregation of duties (TC-AG-049, 058-060, 066-067, 097-099) and the self-approval check (HALLAZGO-013) are not fully verifiable in the UI | Medium | Explicitly marked "not reproducible" instead of forcing a false "Pass"; re-verify against the real backend with 2 users once available |
| R-04 | The real backend is not yet authorized to be stood up — blocks closing the 41 API cases and re-verifying all findings | High | Explicit pending item in section 5; this is not a risk this report can mitigate unilaterally, it requires a user/product decision |

### 6.5 Entry and Exit Criteria

**Entry (to start a new verification batch):** the previous batch must have closed with its regression run green (see section 4), and the demo must be reachable on the same version used for the previous batch (or the difference must have been audited first, as with the 2026-10-01 redeploy).

**Exit (for this report to stop being "living" and move to closure/certification):**
1. All 100 UI cases **and** all 41 API cases verified case by case (today: 100/141).
2. The 13 findings (or whichever survive) re-verified against the real backend (the master-data backend repo), not just against the mock demo.
3. Zero unresolved **High**-severity findings, or none without a correction plan accepted by the vendor (today: HALLAZGO-006 and HALLAZGO-009 remain open).
4. A formal report of the confirmed findings delivered to the vendor, with a logged response (accepted/rejected/in progress per finding).

### 6.6 Traceability

This report's traceability matrix is sections 2 and 3 together: section 2 maps each block of 10 `TC-AG-###` to its result (confirmed/discrepancy/not reproducible) and to the `HALLAZGO-###` findings that explain each discrepancy; section 3 expands each `HALLAZGO-###` back out to its related `TC-AG-###` cases, its automated test (`affinity-groups-ui.spec.ts`), and its evidence note (maintained internally, not included in this public copy). No test case or finding exists without that triple reference (case ↔ finding ↔ automated test).

### 6.7 Deliverables

- This report (`qa-report-cobranza-kpi.md` / `reporte-qa-cobranza-kpi.md` in Spanish), updated per batch.
- Companion findings summary (`findings-affinity-groups.md` / `hallazgos-affinity-groups.md`), a compact table format for development.
- Playwright automation suite (`tests/affinity-groups-ui.spec.ts`), 92/92 tests passing.
- Interactive HTML dashboard (`report/dashboard.html`), generated with the `hallazgos-html` skill.
- Individual finding notes (maintained internally, not included in this public copy), one per `HALLAZGO-###`.
- Photographic evidence per finding (`report/evidence/HALLAZGO-###.png`).

### 6.8 Approvals

| Role | Name | Status | Date |
|---|---|---|---|
| QA (author) | Luis Aranguren | Approved (UI batch) | 2026-10-05 |
| Development (vendor) | — | Pending formal submission | — |
| Product Owner (client) | — | Pending | — |

This approval block is pending real names from the vendor/Product Owner — it will be completed once the formal findings report is sent (see exit criterion 6.5.4).
