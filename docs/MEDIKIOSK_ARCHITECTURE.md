# MediKiosk — Canonical System Architecture

> This is the **north-star specification** for this project, authored by the project owner.
> It supersedes all earlier planning documents in this repo.
> Build order and implementation decisions must trace back to a section here.

**One-line definition (§72):** MediKiosk is an AI-enabled, multilingual,
patient-centric hospital platform that continuously connects patient
registration, adaptive clinical history, AYUSH assessment, medical-document
intelligence, vitals, intelligent queue management, doctor consultation,
laboratory workflows, referrals, follow-up care and ABDM-enabled health-record
exchange into one longitudinal healthcare journey.

**The governing principle:** *Never make the patient restart the process.*
Information flows `Profile → OPD → History → Doctor → Lab → Result → Follow-up
→ Next Visit` under one patient identity, encounter context, consent and
longitudinal record.

---

## 0. Platform shape

Three role-based systems — **Patient**, **Doctor**, **Laboratory** — plus a
**Hospital Admin** operational layer (§53), over a shared core:

```
Identity │ Consent │ Patient Registry │ Encounter │ Queue │ Notifications
AI Engine │ Document Engine │ Clinical Record │ Audit │ Security
                              │
                    ABDM Integration Layer
              ABHA / Consent / HIE / FHIR  (isolated, §63)
```

---

## 1. Data model (§59) — the 25 core entities

`User` · `Patient` · `FamilyMember` · `ABHAIdentity` · `Consent` · `Hospital` ·
`Department` · `Doctor` · `Laboratory` · `Kiosk` · `Appointment` · `Queue` ·
`Encounter` · `Symptom` · `History` · `Vital` · `Medication` · `Prescription` ·
`Document` · `OCRExtraction` · `InvestigationOrder` · `LabSample` ·
`LabResult` · `Referral` · `FollowUp` · `Notification` · `AuditLog` · `AIEvent`

### Relationship model (§60, §61) — Encounter is the central object

```
Patient
 ├── ABHA Identity
 ├── Consents
 ├── Health Profile
 ├── Medications
 ├── Vitals
 ├── Documents
 └── Encounters                  ← everything clinical hangs HERE, not on Patient
        ├── History
        ├── Vitals
        ├── Doctor
        ├── Diagnosis
        ├── Prescription
        ├── Lab Orders → Lab Results
        ├── Referrals
        └── Follow-ups
```

**Hard rule (§61):** do not connect clinical data randomly to `Patient`.
Route it through `Encounter`.

---

## 2. Identity & family accounts (§2)

`Mobile → OTP → identity resolution → select profile | new patient flow`

One mobile account may manage multiple beneficiaries (self, father, mother,
child, …). **Every beneficiary gets a separate health identity and health
record**, with its own authorization/consent boundary.

**Constraint:** ABHA creation/linking is an **ABDM-governed identity flow**
under consent. Do *not* auto-create ABHA from Aadhaar as a local DB operation.

---

## 3. Patient experience

**Dashboard (§3)** — deliberately simple: See a Doctor · OPD Registration ·
My Medicines · My Lab Reports · My Documents · My Vitals · My Visits ·
My Queue/Appointments · Family Members · Consent & Privacy.

**Health Profile (§4)** — basic info (incl. blood group, emergency contact);
medical info (allergies, existing diseases, surgeries, hospitalizations,
family/personal history, current medications); and **AYUSH fields**
(Prakriti, Vikriti, Ahara, Vihara, Agni, Koshtha, Dashavidha Pariksha).

**Smart profile (§5)** — do not make patients fill everything manually.
Capture by voice, store structured with provenance. Unknown data must be
recorded as **`Not reported`**, never as **`No`**. This is an AI-safety rule.

**Medicines (§6)** — four buckets: `CURRENT`, `PREVIOUS`, `STOPPED`,
`NEEDS CONFIRMATION`. The last is re-confirmed at each OPD registration.

**Symptom capture (§10)** — four inputs, one structured representation:
body map · voice · text · quick-symptom chips.

**Low-literacy mode (§45)** — a real system mode: Listen / Speak / Tap /
Repeat / Help. Operating the kiosk must not require reading a paragraph.

**Accessibility (§57)** — large text, large buttons, high contrast, audio
navigation, multiple languages, simple vocabulary, repeat button, caregiver
mode, attendant-assistance button.

**Caregiver mode (§58)** — when the answers come from a caregiver, provenance
must record `Source: Caregiver`, not `Patient reported`.

---

## 4. Clinical intake

### Adaptive History Engine (§11)
Not a fixed 30-question form. Model is **Known → Missing → Ask only what is
needed**, computed from profile + previous history + current complaint +
previous medicines + previous documents.

### Two modes (§12, §13)
- **Mode 1 — Modern Clinical OPD:** Chief Complaint → HPI → Past Medical →
  Past Surgical → Drug History → Allergies → Family → Personal → ROS →
  Investigations → Vitals.
- **Mode 2 — AYUSH/Ayurvedic OPD:** Chief Complaint → Nidana → Samprapti →
  Prakriti → Vikriti → Dashavidha Pariksha → Ahara → Vihara → Agni → Koshtha.

Mode 2 question sets must be **configurable per hospital/clinical protocol**,
not hard-coded universally.

### Clinical Knowledge Layer (§43)
The LLM handles natural-language understanding. The **clinical structure and
allowed questions are controlled** by a rules/ontology layer
(complaint → required attributes → red flags). The LLM must not invent the
clinical interview.

### Vitals (§14)
At home: value + timestamp + source (patient-entered). At hospital: automatic
capture from kiosk peripherals — safer than manual typing.

### Red flags (§15)
Red-flag detection is a **triage trigger, not autonomous diagnosis**.
`AI flag → immediate human triage → confirmed priority → emergency queue`.
The LLM must never independently declare a disease.

### Emergency misuse (§16)
Escalate as: warning → manual verification required → hospital staff review.
A patient must **never** lose access to emergency evaluation because of an
automated score.

---

## 5. Document intelligence

**Pipeline (§7):** Image/PDF → quality check → pre-processing → OCR →
language detection → medical entity extraction → validation → classification →
date extraction → medical timeline.

**Handwritten prescriptions (§39):** scan → OCR/handwriting recognition →
structured extraction → **doctor confirmation** → attach to encounter.
Always preserve **both** the original image and the structured extraction.

---

## 6. Evidence-Linked Clinical Record — the trust layer

**Every extracted value carries a source (§8).** e.g. `Hb 9.8 g/dL — source:
CBC report, 06 Sep 2026`; `Diagnosis: Hypertension — source: Doctor,
encounter ENC-20260909-015`. This prevents an AI-generated statement being
mistaken for an established diagnosis.

**Confidence states (§66):** `Confirmed` · `Patient reported` ·
`Document derived` · `Uncertain` · `Conflicting` · `Not reported`.

**Conflict detection (§65):** when sources disagree, surface both and require
doctor verification. Never silently pick one.

**What changed since last visit (§41):** NEW / CHANGED / UNCHANGED, shown on
the doctor dashboard.

**Doctor keeps control (§25):** the physician can accept, modify, or reject
any AI-generated summary.

---

## 7. Flow engines

**Department routing (§17)** — complaint + history + vitals + records →
suggested department. Describe as *AI-assisted routing*, not diagnosis.

**Queue engine (§18, §19)** — not a token counter. ETA =
patients ahead + doctor's live consultation speed + priority cases +
availability + follow-up capacity. Show a **range** ("15–25 minutes"),
never false precision like "18 min 12 sec".

**Token document (§20)** — token, patient, department, doctor, room, patients
ahead, estimated wait, QR to track queue. Printable and digitally stored.

---

## 8. Doctor system

Doctor login is **separate** from patient login (§21), using verified
professional identity / ABDM professional registry — not a self-claimed role.

**Dashboard (§22):** normal queue, emergency, follow-up, checked-today,
current patient, open-patient action.

**Patient view (§24):** a 30-second summary — current complaint, red flags,
new information, known conditions, current medicines, latest vitals, recent
investigations — then drill-down to detailed history.

**Consultation workspace (§26):** symptoms · examination · diagnosis ·
investigations · prescription (medicine/dose/frequency/duration/instructions) ·
advice · referral · follow-up · sign & complete encounter.

**Follow-up decision is explicit (§37):** No / After lab result / Tomorrow /
Specific date / Emergency return if symptoms worsen.

---

## 9. Laboratory system

**Order (§27):** doctor orders test → `InvestigationOrder` created with
patient, doctor, encounter, test, priority → QR generated.

**Dashboard (§28):** today's samples · pending · in progress · completed ·
verified · critical/attention · follow-up required.

**Workflow (§29):** order → QR → scan → lab queue → sample collected → test
performed → result entered → result verified → report generated → doctor
notified → follow-up workflow.

**Result entry (§30):** test, parameter, result, unit, reference range, sample
datetime, result datetime, technician, verification, remarks.
**The original lab result must be retained and never silently overwritten.**

---

## 10. Continuity Engine (§31–37, §69) — the headline differentiator

A patient who already saw the doctor must **never** restart OPD registration
just because a lab report came back later.

```
Doctor visit → test ordered → lab completed → result verified
    → system detects "Doctor Review Required"
    → FOLLOW-UP ENCOUNTER CREATED
```

**Two logical queues (§32):** Normal OPD, and a **Follow-up queue** for
patients returning due to lab result, imaging, doctor review, referral return,
or treatment follow-up.

**Follow-up time windows (§34)** rather than a second free-for-all queue —
slots assigned from report completion + doctor availability + priority +
existing queue + hospital capacity. Prevents everyone with a report arriving
at once.

**Next-day review (§35):** creates a follow-up with date, time window, doctor,
room, reason. No new OPD history, no new token, no repeated registration.

**Linked Care Task (§36):** with multiple pending tests, the follow-up waits
until the required result set is complete, then generates the slot.

**Referral (§38):** same hospital (department → doctor → reason → priority) or
external (hospital → department → reason → note → referral ID/QR). Receiving
facility retrieves referral info subject to authorization.

**Medical timeline (§40):** visits, labs, documents threaded chronologically.

---

## 11. AI layer (§42) — separate controlled services, not one giant "AI"

`ASR` · `OCR` · `History AI` · `Summary AI` · `Risk Engine`, plus medical
entity extraction, translation, TTS, clinical change detection, department
routing, queue prediction.

**Summary pipeline (§64):** patient speech → ASR → structured facts, merged
with OCR entities from old documents → clinical merge → conflict detection →
evidence validation → structured summary → **doctor review** → final encounter.

**Multilingual (§44):** translate the *interaction*, not the medical meaning.
The structured record uses controlled medical terminology.

---

## 12. Consent, security, audit

**Granular consent (§46):** separate consents for clinical history collection ·
document scanning · sharing with current doctor · sharing with laboratory ·
ABDM record exchange · optional secondary uses. Each readable *and audible* in
the patient's language.

**Traceable (§47):** store consent ID, patient, purpose, data scope, recipient,
datetime, method, language, status, revoked flag.

**Revocable (§48):** patient dashboard lists active consents and can revoke.

**Access control (§49):** role-based **and purpose-based**.
Patient → own records. Doctor → relevant info for assigned/current encounters
and permitted history. Lab → only what the ordered test requires. Admin →
operational data, not unrestricted clinical content. AI → minimum data needed
for the requested operation.

**Audit log (§50):** who, what, whose record, when, why, what was accessed.

**Security (§51):** encryption in transit and at rest, session timeout, device
auth, RBAC, audit logs, secure deletion, data minimization, kiosk session
cleanup.

**Kiosk session (§52):** on completion — submit → sync → session reset →
temporary cache cleared → next patient starts clean. Essential on a shared
public device.

---

## 13. Hospital configuration (§53, §54)

Nothing hard-coded. Hospital → Departments → (Doctors, Rooms, Working hours,
Queue policy); plus Labs, Kiosks, Services. Admin manages departments, doctors,
timings, rooms, queue rules, kiosks, lab services, emergency rules, holidays,
appointment capacity.

---

## 14. Offline & notifications

**Offline (§55):** kiosk may cache language packs, UI, basic workflow, queue
state and non-sensitive operational data, then sync securely on reconnect.
**Do not pretend the ABDM ecosystem works offline** — distinguish local
operational continuity from external health-information synchronization.

**Notifications (§56):** SMS, WhatsApp (where institutionally supported and
consented), app/web push, kiosk printout, voice announcement.

---

## 15. Services (§62)

Identity · Patient · Doctor · Hospital · Consent · Encounter · Queue ·
AI History · OCR · Document · Lab · Prescription · Referral · Notification ·
ABDM Integration · Audit.

---

## 16. The five core innovations (§70)

1. **Zero-Friction Clinical Intake** — voice + touch + text + body map,
   multilingual, low-literacy UX.
2. **AI Medical Record Understanding** — OCR + handwriting + classification +
   medical extraction + timeline.
3. **Evidence-Linked Clinical Intelligence** — known/new/conflict/uncertain,
   source tracking, doctor verification, "what changed".
4. **Intelligent Hospital Flow** — routing + doctor selection + dynamic ETA +
   emergency priority + lab workflow + referrals + follow-ups.
5. **Continuity of Care** — one encounter connects consultation → lab →
   result → doctor review → follow-up, without restarting registration.
