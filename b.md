# MediKiosk — Doctor/Lab Dashboard Correction & Production-Hardening Phases
### Verified against the latest code you uploaded. Your agent did real, substantial integration work since the last review — this document confirms what's now actually fixed, answers your second-day-queue question directly, and gives the remaining phases to take this from "working" to "full, correct, production-grade, not a demo."

---

## PART A — CONFIRMED: THE MAJOR INTEGRATION GAPS ARE NOW ACTUALLY FIXED

I re-traced the code rather than trusting a status file again. This time the evidence backs it up:

- `IntakeSession` is fully gone. `kioskRoutes.js` now genuinely creates and updates real `Encounter` documents, and routes patient intake through the controlled AI layer (`historyAiService`, `riskEngine`, `routingService`, `summaryAiService`) instead of bespoke inline logic.
- `ConsentScreen.jsx` now really calls `POST /api/consent/grant`/`revoke` — the granular per-purpose consent system is live, not decorative.
- `AuthGateway.jsx` now runs the real §2 flow: `POST /api/auth/otp/request` → `/verify-otp` → family-member selection, and "link ABHA" correctly goes through the compliant `/api/abha/link-request` stub instead of auto-generating a number.
- The five missing patient screens now exist and are wired to real endpoints: **My Consent**, **Family Members**, **Live Queue/Follow-up Status**, **Referral View**, **ABHA Link Status** — all reachable from the app's routes.
- **Your second-day-queue question is already solved in the code** — see Part B below, because I want to walk you through exactly how, since you asked directly and it's worth understanding rather than just trusting it works.

Two things are still not wired (carry these into Phase D3 below): nothing calls `notificationEngine.js` automatically yet (a report goes "ready" and no SMS/push actually fires), and `cronJobs.js` doesn't hook into it either.

---

## PART B — YOUR SECOND-DAY QUEUE QUESTION, ANSWERED DIRECTLY

You wrote: *"patient is not going to fill kiosk on second day after his reports comes and doesn't want to wait in the line — what can we do here?"*

Here's exactly what the code now does, end to end:

1. Doctor orders a CBC during today's visit → an `InvestigationOrder` is created, linked to today's `Encounter`.
2. Patient goes to the lab, sample is collected, result is entered.
3. **The moment the lab technician clicks "Verify"** on that result (`POST /api/lab/results/:id/verify`), the backend automatically — with no extra step from anyone — does three things in the same request:
   - Marks the `InvestigationOrder` as `verified`.
   - Creates (or updates) a **`FollowUp`** document tied to the *original* encounter, with `reason: 'lab_result'` and a `scheduledWindow` (currently defaulted to tomorrow, 9:30–10:00 — see Phase D3 for making this dynamic per hospital capacity).
   - Flips the original `Encounter.status` to `doctor_review`.
4. The patient never touches a kiosk again. They open **Live Queue / Follow-up Status** (the new page) on their phone, or their `/queue` view, and see their follow-up slot directly — because it's reading from the same `FollowUp` collection the lab just wrote to.
5. The next day, the doctor's dashboard shows this patient in a **Follow-up** queue (separate from the normal walk-in queue) at their assigned time window — same `Patient`, same original `Encounter` history, same token concept — with zero re-registration.

This is precisely the "Continuity Engine" your architecture doc calls the most important idea in the whole project (§69), and it's the direct answer to the exact problem you described not knowing how to solve. It's real and running — the piece still missing is that the patient isn't *told* proactively (no SMS/push fires yet); that's Phase D3, item 1.

---

## PART C — WHAT'S STILL WRONG WITH THE DOCTOR DASHBOARD (verified specifics)

`frontend/src/pages/DoctorDashboard.jsx` is 2,305 lines in a single file. Functionally most of the right pieces are present (Investigation Orders §27, Referral §38, Follow-up Decision §37, a "What Changed" delta panel §41) — but three real problems remain:

1. **Hardcoded demo content sitting in component state**, e.g. a fixed preset called `'Acute Coronary Syndrome (Emergency Triage)'` with a hardcoded medicine (`'Prabhakar Vati'`) and a default `newInvestigation` pre-filled to `'HbA1c'`/`'Lipid Profile (Fasting)'`. This is exactly the kind of thing that makes a build feel like a demo instead of a real product — a doctor should see an empty, real form driven by the actual patient in front of them, with dropdown options sourced from your `clinicalOntology.js` / diagnosis code tables, never a pre-typed example value.
2. **A leftover herb-drug interaction check** (`runInteractionCheck`, hitting `POST /api/kiosk/check-interactions`) is still wired into the prescription builder. This is the one piece of the old VaidyaSetu interaction-checker that survived the Phase 0 cleanup — deliberately, it looks like, re-scoped down into a small prescription-safety sub-feature rather than the old standalone product. That's a legitimate design choice (I flagged this as an acceptable fallback option in the original removal list), but it's your call: either (a) keep it as a small "Safety Check" button in the prescription section and document it as an intentional addition beyond the 72-section spec, or (b) remove `check-interactions` and `runInteractionCheck` entirely if you want the build to match the architecture doc exactly with nothing extra. Decide this explicitly rather than leaving it as an unlabeled leftover.
3. **The file is too large to safely maintain.** At 2,305 lines, small changes risk breaking unrelated sections. Split it before adding anything else.

### Doctor Dashboard correction phase (Phase D1)

1. Split `DoctorDashboard.jsx` into: `DoctorQueuePanel.jsx` (§22's normal/emergency/follow-up/checked-today counts), `PatientSummaryCard.jsx` (§24's 30-second summary + §25 source/confidence badges), `ConsultationWorkspace.jsx` (§26: symptoms/examination/diagnosis/investigation/prescription/advice), `ReferralModal.jsx` (§38), `FollowUpDecisionSelector.jsx` (§37's exact 5-choice enum), and `ChangeDeltaPanel.jsx` (§41). Keep `DoctorDashboard.jsx` as the thin container that fetches data and composes these.
2. Remove every hardcoded preset value (`'Acute Coronary Syndrome...'`, `'Prabhakar Vati'`, default `'HbA1c'`/`'Lipid Profile'`) — initialize all form state to empty/`null` and source dropdown *options* (not default *values*) from `clinicalOntology.js` and a real diagnosis code list.
3. Confirm §25's provenance badges render on every value pulled onto the summary card — pull straight from each field's `source`/`confidence` on `History`/`Medication`/`OCRExtraction`, not a generic "AI generated" label.
4. Decide and act on the interaction-check leftover per point 2 above.
5. Confirm the "Checked Today" counter on the queue panel is a real query (`Encounter.count({doctorId, status: 'closed', closedAt: {$gte: todayStart}})`), not a static number.

**Acceptance check:** opening a brand-new patient's consultation workspace shows every field empty with no pre-filled example text; `grep -n "Prabhakar Vati\|Acute Coronary Syndrome (Emergency Triage)" frontend/src/pages/*.jsx` returns nothing (unless it's real seed/reference data explicitly labeled as such, not a UI default).

---

## PART D — WHAT'S STILL WRONG WITH THE LAB DASHBOARD

`frontend/src/pages/LabDashboard.jsx` currently renders only two views: **Pending Orders** and **Critical Results**. Your architecture (§28) calls for the full set:

```
Today's Samples │ Pending │ In Progress │ Completed │ Verified │ Critical/Attention │ Follow-up Required
```

Only 2 of these 7 exist today. The backend (`labWorkflowRoutes.js`) already has the state machine (`ordered → collected → processing → resulted → verified`) — this is a frontend gap, not a data-model gap.

### Lab Dashboard correction phase (Phase D2)

1. Add the missing tabs: **Today's Samples** (all `InvestigationOrder`s with `createdAt` = today, any status), **In Progress** (`LabSample.status = 'processing'`), **Completed** (`LabResult` exists but `verifiedAt` is null), **Verified** (`LabResult.verifiedAt` set), **Follow-up Required** (join against the `FollowUp` collection where `linkedOrderIds` includes this order and `status != 'complete'`).
2. Wire the QR-scan step explicitly: confirm there's a working "scan QR" action on the lab dashboard that resolves a `LabSample` by its QR payload and moves it from `ordered` → `collected` in one tap — check whether this exists today; if the lab tech is instead searching by patient name, that's a workflow gap against §28's "technician scans the patient's QR" requirement.
3. Surface the same "never overwrite" versioning from §30 in the UI: when a lab tech opens a `Verified` result, show the amendment history if `LabResult` has more than one version for that order, not just the latest value.

**Acceptance check:** all 7 tabs from §28 are present and each shows real counts pulled from Mongo, not hardcoded; scanning a token QR (or entering its code, if you don't have a physical scanner in dev) correctly resolves the right `LabSample`.

---

## PART E — REMAINING PRODUCTION-HARDENING PHASES (so "full and perfect" holds up outside a demo)

### Phase D3 — Make notifications actually fire (still the biggest functional gap)
1. In `labWorkflowRoutes.js`'s `/verify` handler (the block described in Part B above), add a call to `notificationEngine.js` right after the `FollowUp` is created/updated — send the "Your report is ready, follow-up slot is X–Y" notification (§56) at that exact moment, gated by whether the patient has granted the relevant `Consent` purpose (from Phase D-adjacent Integration Phase 2/6 work already done).
2. Do the same at queue-token-issue (§20) and at "doctor now seeing token X" (§19) — hook these into `queueRoutes.js`'s state transitions.
3. Make the `FollowUp.scheduledWindow` computation in Part B dynamic instead of a fixed `09:30–10:00` string: read the department's actual queue policy/capacity (already modeled on `Department`) and the doctor's rolling consultation speed (already tracked on `Doctor.consultationStats`) the same way the normal-queue ETA calculation does.

**Acceptance check:** verifying a lab result produces a real row in the `notifications` collection in the same request; the assigned follow-up window varies by department/doctor load instead of always being the same hardcoded string.

### Phase D4 — Remove remaining demo/placeholder data everywhere, not just the Doctor Dashboard
1. Search the whole frontend for other hardcoded example values the same way you did for the doctor dashboard: `grep -rn "TODO\|FIXME\|placeholder=\"e.g" frontend/src/pages` and clear anything that would show up as pre-filled example text to a real user.
2. Confirm the hardcoded dev OTP (`'123456'`) is clearly gated behind a `NODE_ENV !== 'production'` check in `authRoutes.js`, and that a real SMS provider (Twilio/MSG91/Gupshup — pick one) is wired in for production, even if it's not exercised in your dev/demo environment.
3. Re-run the full click-through from Part B (order test → verify result → see follow-up) in the actual browser one more time after Phase D1–D3, and confirm nothing regressed.

### Phase D5 — Final pass on the two things every reviewer will click first
1. Doctor Dashboard: open a patient with a real prior visit and confirm the §41 "What Changed" panel shows a genuine diff (not empty, not fabricated) between this encounter and the last one.
2. Lab Dashboard: run one full sample through all 7 tabs live in the browser end to end, confirming each tab's count updates without a page refresh (or with an acceptable poll interval), matching §28's operational picture exactly.

---

## SUMMARY: WHAT TO TELL YOUR AGENT NEXT

> *"Do Phase D1 (Doctor Dashboard: split the file, remove all hardcoded preset values, decide on the interaction-check leftover) and Phase D2 (Lab Dashboard: add the 5 missing status tabs, wire QR scan, show amendment history) first — these are the two screens the user is judging the whole project by. Then Phase D3 (make notifications actually fire on lab-verify and queue-status-change) closes the last functional gap. Phase D4 and D5 are the final hardening/QA pass before calling this done."*