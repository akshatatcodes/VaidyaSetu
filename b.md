# MediKiosk — Integration Reality Check & Wiring-Completion Plan
### What your agent actually built vs. what is actually connected to the live product, verified line-by-line against the new codebase — plus the exact phases left to make this real, production-grade, and fully routed (no parallel/dead systems).

> This is a direct continuation of `MEDIKIOSK_REBUILD_BLUEPRINT.md`. That plan's Phase 0 (cleanup) and Phase 1 (new data model) were genuinely carried out — the legacy VaidyaSetu files are gone and all 18 new models/routes/services now exist in the repo. But **"the files exist" is not the same as "the product uses them."** I opened the actual route files and traced every new endpoint to its real caller (or lack of one). This document tells you exactly which wires are connected and which are dangling, so the next work is 100% about finishing the connections — not writing more scaffolding.

---

## PART A — WHAT I FOUND WHEN I TRACED IT (verified, not assumed)

Your repo included a self-generated status file (`a.txt`, "SYSTEM INTEGRITY & LINKAGE VERIFICATION REPORT") claiming every phase is **"Linked"** and the system is **"100% OPERATIONAL."** I checked this directly against the code instead of taking it at face value, because this is exactly the kind of claim that needs verifying, not trusting. Here's the real picture:

### A.1 — The core problem: you now have TWO parallel systems, and the live product still runs on the old one

The `IntakeSession` model (the old god-object) was **never deleted**. It's still `require()`'d and actively used as the primary data store by:

- `backend/src/routes/kioskRoutes.js` — **this is the actual patient-facing OPD intake flow.** Every session-start, vitals capture, SOCRATES probe, dashavidha capture, consent checkbox, and SOAP generation call in `frontend/src/pages/KioskIntake.jsx` hits `/api/kiosk/session/...`, which reads/writes `IntakeSession`, not `Encounter`.
- `backend/src/routes/kioskExtensionRoutes.js`, `adminRoutes.js`, `labWorkflowRoutes.js` (partially), `Department.js`, `Doctor.js`, `facilityService.js`, `abdmAdapter.js`, `cronJobs.js`.

Meanwhile, the new `Encounter`, `Consent`, `FollowUp`, `Referral`, `Notification` models have their own routes (`encounterRoutes.js`, `consentRoutes.js`, `continuityRoutes.js`, `notificationRoutes.js`) — but I traced every one of them against the frontend and found:

| New route | Has real logic? | Called by frontend? | Verdict |
|---|---|---|---|
| `POST/GET /api/encounters/*` | Yes, solid CRUD | **No — zero callers found anywhere in `frontend/src`** | Orphaned. No real `Encounter` document will ever be created by the actual product today. |
| `POST /api/consent/grant`, `/revoke`, `GET /my` | Yes, matches §46–§48 fields | **No.** `KioskIntake.jsx`'s "consent" call goes to `/api/kiosk/session/:id/consent` (the old 4-boolean embedded object), not `/api/consent/*`. `components/kiosk/ConsentScreen.jsx` makes **zero** API calls at all — it's a disconnected UI shell. | Orphaned. The granular, traceable, revocable consent system exists in the database and nowhere else. |
| `POST /api/continuity/followups/*` | Yes, real logic (verified the linked-care-task and next-day-review code myself) | **Partially** — `DoctorDashboard.jsx` does call into `/api/continuity/*`. | **This one is actually wired.** Keep it, extend it. |
| `/api/queue/*`, `/api/routing/*` | Yes | Called by `AdminDashboard.jsx`, `QueueDisplay.jsx`, `DoctorDashboard.jsx` | **Wired.** Good. |
| `/api/ai/*` (asr/ocr/historyAI/summaryAI/riskEngine/routing/queuePrediction — the §42 controlled AI layer) | Yes, each writes to `AIEvent` correctly | **No callers anywhere in the frontend.** The kiosk intake screen still calls the *old* direct endpoints (`/api/kiosk/session/:id/socrates-probe`, `/generate-soap`) which bypass this layer entirely. | Orphaned. §42's entire point — a controlled, audited AI layer instead of ad-hoc calls — is not actually enforced anywhere real. |
| `/api/abha/link-request` (the new, correctly-stubbed "ABDM-governed, not local" ABHA flow) | Yes | **No.** `AuthGateway.jsx` instead calls `/api/auth/abha/lookup` and `/api/auth/abha/generate` (old `authRoutes.js`) | This is the most important one to fix — the code that actually runs **today** still auto-generates an ABHA number as a local DB operation, which is the exact thing §2's "important correction" tells you not to do. The correct, compliant version was built and then never wired in. |
| `/api/notifications/*` + `notificationEngine.js` | Yes | Not called by frontend (expected — this is a server-push feature) **but also never called by `cronJobs.js` or any lab/queue state-change hook** | Orphaned in the other direction: nothing on the *backend* ever triggers it either. A report becomes "ready" and no notification is ever generated. |
| `/api/auth/otp/request`, `/verify-otp` (real §2 mobile+OTP flow) | Yes, though OTP is a hardcoded `'123456'` dev stub (fine for now, flag for Phase Int-6) | **Frontend still doesn't use this at all for the primary login** — `AuthGateway.jsx` is built around ABHA mobile lookup/generation, not the OTP-then-family-selection flow from §2. | Built correctly, wired to nothing. |
| `patientRoutes.js` (`GET /api/patients/:id`, `GET /api/patients/family-members/:id`) | Yes | **Yes — actually called by `HealthProfile.jsx`**, with a fallback to the old `/api/profile/:id` if not found. | **Partially wired — the best-integrated piece of the new system.** This is your template for how the rest should look. |
| `UserProfile.js` slimmed to real §4 shape | Done correctly | `profileRoutes.js`/`userRoutes.js` still read/write it directly instead of the new `Patient` model | Model was fixed; the routes serving it weren't switched over. |

### A.2 — Why this happened (so it doesn't happen again)

Your agent built every new file **in isolation**, one model/route/service per Phase-N step, and each individual phase's own test (`phaseN.*.test.js`) passed because those tests call the *new* route directly with `supertest`, not through the real user-facing flow. **128/128 tests passing tells you the new code works in isolation — it says nothing about whether the product's actual click-path reaches it.** That's the gap between "implemented" and "implemented and routed properly," which is exactly what you flagged.

### A.3 — The fix is not more new code. It's deleting the old path and re-pointing the existing UI at the new one, file by file.

---

## PART B — INTEGRATION-COMPLETION PHASES

Each phase below names the exact old call to remove and the exact new call to put in its place. Do them in order — later phases assume earlier ones are done and `IntakeSession` usage is shrinking, not growing.

### Integration Phase 1 — Make Encounter the only way a visit gets created
**Goal:** Kill the single biggest gap: today, zero real `Encounter` documents are ever created by the live app.

1. In `kioskRoutes.js`, replace `POST /session/start` (which creates an `IntakeSession`) with a call into `POST /api/encounters` (creates a real `Encounter`) followed by creating the linked `Symptom`/`Vital`/`History` child docs as the intake proceeds — do **not** keep writing to `IntakeSession` in parallel "just in case."
2. Update `frontend/src/pages/KioskIntake.jsx`: every `axios` call currently targeting `/api/kiosk/session/:id/...` gets repointed to the matching `/api/encounters/:id/...` sub-resource (vitals → `Vital`, dashavidha → `History`, documents → `Document`, socrates-probe → route through `/api/ai/historyAI` from Integration Phase 4, not a bespoke kiosk-only endpoint).
3. Delete `models/IntakeSession.js` **only after** step 1–2 are live and the migration script (`migrate_intakesession_to_encounter.js`) has been run against any existing data one final time.
4. Remove the `IntakeSession` import from every file in the "still referenced" list from Part A.1 (`kioskExtensionRoutes.js`, `adminRoutes.js`, `labWorkflowRoutes.js`, `Department.js`, `Doctor.js`, `facilityService.js`, `abdmAdapter.js`, `cronJobs.js`) — each of these should read from `Encounter`/its children instead.

**Mechanical acceptance check (run this, don't eyeball it):**
```
grep -rl "IntakeSession" backend/src frontend/src   # must return nothing
```
Then manually run one full kiosk intake in the browser and confirm a document actually appears in the `encounters` Mongo collection — not just that the test suite is green.

---

### Integration Phase 2 — Wire the real Consent system into the actual consent screen
1. Give `components/kiosk/ConsentScreen.jsx` real `axios` calls: on each of the six consent toggles (§46: clinical history, document scanning, doctor sharing, lab sharing, ABDM exchange, optional secondary use), call `POST /api/consent/grant` or `/revoke` with the matching `purpose`.
2. Delete the old embedded `consent: {dataCapture, documentStorage, doctorSharing, audioNarrated}` block usage from `kioskRoutes.js` (it goes away automatically once `IntakeSession` is deleted in Phase 1, but confirm nothing new reads it).
3. Build the missing **"My Consent"** patient-dashboard page (§48) — this page does not exist yet anywhere in `frontend/src/pages`. It should call `GET /api/consent/my` and let the patient revoke.

**Acceptance check:** granting/declining a consent toggle on the kiosk creates a real row in the `consents` collection with all of §47's fields populated (not just a boolean); the new "My Consent" page correctly lists and can revoke it.

---

### Integration Phase 3 — Fix the ABHA/identity flow to actually match §2
This is the one compliance-shaped gap worth prioritizing even in a hackathon build, because it's explicitly called out in your own architecture doc as something to get right.

1. In `AuthGateway.jsx`, replace the calls to `/api/auth/abha/lookup` and `/api/auth/abha/generate` with the real §2 flow: `POST /api/auth/otp/request` → `POST /api/auth/otp/verify` → on success, `GET /api/patients/family-members/:mobileId>` to show the "select profile / add new" screen from §2's own diagram.
2. Point any "link my ABHA" action at the already-correctly-built `POST /api/abha/link-request` (which just records intent/status) instead of generating a number locally.
3. Delete the `abha/lookup` and `abha/generate` handlers from `authRoutes.js` once nothing calls them — don't leave a second, easier-to-misuse path sitting in the code.

**Acceptance check:** `grep -rn "abha/generate\|abha/lookup" frontend/src backend/src` returns nothing; a fresh mobile number can complete OTP login and land on a family-member selection screen, not an auto-generated ABHA number.

---

### Integration Phase 4 — Route all AI calls through the controlled §42 layer
1. In the intake flow (post–Integration Phase 1, this is now hitting `Encounter` sub-routes), have the SOCRATES-probe step call `POST /api/ai/history` (which wraps `historyAiService.js`) instead of the old bespoke `/kiosk/session/:id/socrates-probe` handler.
2. Route red-flag scoring through `POST /api/ai/risk` (`riskEngine.js`) rather than any inline emergency-check code duplicated elsewhere.
3. Route department suggestion through `POST /api/ai/routing` and the doctor's SOAP-note generation through `POST /api/ai/summary`.
4. Verify every one of these calls is producing an `AIEvent` row — that's your proof the audit layer is actually catching real traffic, not just the isolated Phase-10 test's synthetic calls.

**Acceptance check:** after a full patient intake + doctor consultation, `db.aievents.find()` shows a realistic sequence of `historyAI` → `riskEngine` → `routing` → `summaryAI` entries tied to the same `encounterId` — not zero, not just the ones from `jest`.

---

### Integration Phase 5 — Trigger the Continuity Engine automatically, not manually
Right now `POST /api/continuity/followups/trigger-lab-check` is correctly built but **nothing calls it when a lab result actually gets verified** — it's only reachable if something explicitly posts to it.

1. In `labWorkflowRoutes.js`, at the exact point where a `LabResult.verified` flips to `true`, add a server-side call into the same logic `trigger-lab-check` uses (extract it into a shared function, e.g. `continuityService.evaluateFollowUpForResult(labResultId)`, and call that function from both the HTTP route and the lab-verification handler — don't make the lab route fetch its own HTTP endpoint over the network).
2. Confirm the Linked Care Task logic (§36) actually gets exercised when a doctor orders 3 tests and only 2 come back — the follow-up should stay `waiting_for_results` and only flip to `schedulable` once the third result lands.

**Acceptance check:** verifying a lab result in the Lab Dashboard UI — with no other manual step — produces a new `FollowUp` document within the same request cycle; check this by watching the `followups` collection while clicking "Verify" in the browser, not by calling the continuity route directly.

---

### Integration Phase 6 — Make notifications actually fire
1. Extend `cronJobs.js` (or add a Mongoose post-save hook on `LabResult`, `FollowUp`, and `Queue`) to call `notificationEngine.js` on the real trigger events from §56: report ready, "doctor now seeing token X," "proceed to room," follow-up slot assigned.
2. Gate every notification send behind the matching `Consent` scope from Integration Phase 2 (e.g., no WhatsApp send unless that purpose is `Active`) — this is the point where Consent and Notification actually need to talk to each other, so do this after Phase 2, not before.
3. Replace the SMS/WhatsApp "send" step with clearly-labeled stub functions if you don't have real provider credentials yet (Twilio/Gupshup/etc.) — a stub that logs "would have sent X to Y" is fine for now; a route that exists but is never invoked is not.

**Acceptance check:** completing a lab verification produces a row in the `notifications` collection with `status: sent` (or `stub_sent`), not silence.

---

### Integration Phase 7 — Retire the duplicate profile path
1. Repoint `profileRoutes.js`/`userRoutes.js` to read/write through `Patient` (for health-profile data) and the slimmed `UserProfile`/`User` (for identity/role only) — right now they still do everything against `UserProfile` directly, duplicating what `patientRoutes.js` already does correctly.
2. Once `HealthProfile.jsx`'s fallback-to-`/api/profile/:id` path is no longer needed (because `/api/patients/:id` always resolves), delete the fallback code — a permanent fallback to a legacy endpoint is itself a sign of an unfinished migration.

**Acceptance check:** `grep -n "profile/${" frontend/src/pages/HealthProfile.jsx` returns nothing; every health-profile read/write in the browser network tab goes to `/api/patients/*`.

---

### Integration Phase 8 — Build the missing frontend screens
These backend pieces exist correctly with no UI at all. Build the screens, wired to the routes noted:

| Missing screen | Backend route (already exists) | Architecture §  |
|---|---|---|
| **My Consent** (list + revoke) | `GET /api/consent/my`, `POST /api/consent/revoke` | §48 |
| **Family Members** (add/select beneficiary) | `GET/POST /api/patients/family-member` | §2, §3 |
| **Referral view** (doctor-initiated, patient-facing status) | `continuityRoutes.js` referral endpoints | §38 |
| **Follow-up / Live Queue** (patient-facing "your follow-up slot is 3:00–3:20") | `continuityRoutes.js` + `queueRoutes.js` | §19, §33–34 |
| **ABDM / ABHA link status** (shows `pending_abdm_flow`, not a fake number) | `POST /api/abha/link-request` | §2 |

**Acceptance check:** every row in the table above is reachable from the patient dashboard nav (§3's list: See a Doctor · OPD Registration · My Medicines · My Lab Reports · My Documents · My Vitals · My Visits · My Queue/Appointments · Family Members · Consent & Privacy) — click through the whole dashboard and confirm nothing 404s or silently no-ops.

---

## PART C — HOW TO KEEP THIS FROM HAPPENING AGAIN

Add one rule to your agent's standing instructions for every future phase:

> **A phase is not "done" until there is at least one *browser-driven* end-to-end check (not just a `supertest` call to the new route in isolation) that proves the real UI reaches the new code, and the corresponding old code path has been deleted, not left running in parallel.**

Concretely: after each Integration Phase above, do a real click-through in the running app and watch the Mongo collection or the network tab — not just `npm test`. Passing isolated tests is necessary but is not the same evidence as "routed properly," which is exactly the distinction you asked me to check.