# Findings — Channel Types Module

Bug report confirmed against the demo (`BASE_URL`), verified live and automated in `channel-types-ui.spec.ts`. Pending re-verification against the real backend.

Structure per finding (Description / Severity / Cause / Steps to Reproduce)

## Summary

| # | Title | Severity | Test Cases |
|---|---|---|---|
| BUG-01 | The Code field does not strip spaces while typing | Medium | TC-CHT-015 |
| BUG-02 | The Code field is editable in Edit mode instead of staying locked | Medium | TC-CHT-015, TC-CHT-037 |
| BUG-03 | Validation messages show raw, untranslated i18n keys (shared with Affinity Groups) | Low | TC-CHT-014, TC-CHT-015 |
| BUG-04 | 'Request reason' and 'Submit for Approval' never disable for a no-op edit; the button never shows "Submitting…" in flight | High | TC-CHT-031, TC-CHT-032, TC-CHT-033, TC-CHT-035 |
| BUG-05 | Approval Request cards show a field-by-field diff for Create and Activate/Deactivate too, when it should be edit-only | Medium | TC-CHT-041, TC-CHT-043 |
| BUG-06 | The 'Request type' filter in Approval Requests offers the full action catalog (includes Delete/Retire/Revoke) instead of the documented closed catalog (Create/Edit/Activate/Deactivate) | Medium | TC-CHT-049, TC-CHT-059 |

---

### BUG-01 — The Code field does not strip spaces while typing

| Field | Detail |
|---|---|
| Severity | Medium |
| Test Cases | TC-CHT-015 |
| Cause | The vendor documents that the Code field "converts input to uppercase and strips spaces while typing" (e.g. `retail chain` → `RETAILCHAIN`). In practice, only `.toUpperCase()` is applied — spaces are kept literally (`retail chain qa011` → `RETAIL CHAIN QA011`), which triggers the invalid-format error since the Code pattern doesn't allow spaces. |

**Steps to reproduce:**
1. Open "New Channel Type".
2. Type `retail chain qa011` into the Code field.
3. The field shows `RETAIL CHAIN QA011` (with spaces), marked invalid.

**Evidence:**

---

### BUG-02 — The Code field is editable in Edit mode instead of staying locked

| Field | Detail |
|---|---|
| Severity | Medium |
| Test Cases | TC-CHT-015, TC-CHT-037 |
| Cause | The vendor explicitly documents: "Code can only be set on creation; it is locked/read-only on edit." In practice, the Code field is a normal editable textbox in the Edit dialog — an existing code was successfully changed, and the resulting pending request reflects the accepted change without the field ever having been locked. |

**Steps to reproduce:**
1. Click "Edit" on any existing Channel Type.
2. Change the Code field and submit.
3. The pending request shows the changed Code as a diff — the field was never locked.

**Evidence:**

---

### BUG-03 — Validation messages show raw, untranslated i18n keys

| Field | Detail |
|---|---|
| Severity | Low |
| Test Cases | TC-CHT-014, TC-CHT-015 |
| Cause | **Confirmed in 2 modules** (Affinity Groups and Channel Types) — this is a shared validation/i18n component bug, not specific to this module. Translation entries are missing for the `validation.required`/`validation.invalidFormat` keys in the loaded language bundle; other messages in the same form (mandatory edit reason, duplicate code) are correctly translated. |

**Steps to reproduce:**
1. Open "New Channel Type".
2. Leave Name = "A" (1 character) and Code = "RETAIL@CHAIN" (invalid character), submit.
3. Name shows `validation.required`; Code shows `validation.invalidFormat` — both untranslated.

**Evidence:**

---

### BUG-04 — 'Request reason' and 'Submit for Approval' never disable for a no-op edit

| Field | Detail |
|---|---|
| Severity | High |
| Test Cases | TC-CHT-031, TC-CHT-032, TC-CHT-033, TC-CHT-035 |
| Cause | The vendor documents that, when editing, 'Request reason' and 'Submit for Approval' must stay disabled until a real change exists (whitespace-only edits or reverting a field back to its original value do not count as a change), and that Submit must show "Submitting…" while the request is in flight. In practice, both fields are **always enabled** in the Edit dialog, regardless of whether a real change was made — and although Submit does correctly disable while the request is in flight, its label never switches to "Submitting…". |

**Steps to reproduce:**
1. Open "Edit" on any Channel Type (tested with Propios, Aliados Integrales, and Socios Estratégicos).
2. 'Request reason' and 'Submit for Approval' show up enabled immediately, without touching anything.
3. Type only spaces, or change a field and revert it to its original value — both stay enabled in every case (should disable again).
4. Submitting a real change correctly disables Submit, but its label stays "Submit for Approval" — it never shows "Submitting…".

**Evidence:**

---

### BUG-05 — Approval Request cards show a field diff for Create and Activate/Deactivate too

| Field | Detail |
|---|---|
| Severity | Medium |
| Test Cases | TC-CHT-041, TC-CHT-043 |
| Cause | The vendor documents that the per-field diff (format "Field: previous value struck through → proposed value") is edit-only — a CREATE or Activate/Deactivate card should only show name/code/badges and the "Requested by…" line. In practice, the demo renders the diff for create requests and for status-change (Activate/Deactivate) requests too, including an untranslated value ("third_party") in the creation case. |

**Steps to reproduce:**
1. Create a new Channel Type, or deactivate an existing one, confirming the request.
2. Open "Approval Requests".
3. The resulting card includes diff rows despite being a creation or a status change — documented as edit-only.

**Evidence:**

A Create card should look like this (per the vendor):
```
Retail Chain QA041 · RETAIL_CHAIN_QA041
[CREATE] [Pending]
Requested by demo@example.local on 14/10/2026
```

But on the demo, the diff list shows up too, as if it were an edit:
```
Retail Chain QA041 · RETAIL_CHAIN_QA041
[CREATE] [Pending]
Code: — → RETAIL_CHAIN_QA041
Name: — → Retail Chain QA041
Management nature: — → third_party
Requested by demo@example.local on 14/10/2026
```

Screenshot of the vendor's own test case document (TC-CHT-041), "Expected Result" column:

---

### BUG-06 — The 'Request type' filter offers the full action catalog instead of the documented closed catalog

| Field | Detail |
|---|---|
| Severity | Medium |
| Test Cases | TC-CHT-049, TC-CHT-059 |
| Cause | The vendor documents that, for Channel Types (no Delete/Retire), the Approval Requests "Request type" filter offers only Create/Edit/Activate/Deactivate. In practice, the combobox offers all 8 options of the full catalog: Any type, Create, Edit, Delete, Activate, Deactivate, Retire, Revoke — 3 of them (Delete/Retire/Revoke) can never produce results for this master, and "Revoke" doesn't even exist in the cloned source code's action enum. Secondary finding (not documented by the vendor): both comboboxes in this filter area (Approval status and Request type) lack an accessible name (empty `id`, no `aria-label`), breaking the association with their visually-hidden `<label>`. |

**Steps to reproduce:**
1. Open "Approval Requests" with at least one request in the list.
2. Click the "Request type" combobox.
3. 8 options are listed instead of the 5 (including "Any type") documented.

**Evidence:**

The filter should only offer this (per the vendor):
```
Request type: Any type, Create, Edit, Activate, Deactivate
```

But on the demo it offers the full catalog:
```
Request type: Any type, Create, Edit, Delete, Activate, Deactivate, Retire, Revoke
```

Screenshot of the vendor's own test case document (TC-CHT-049), "Expected Result" column:
