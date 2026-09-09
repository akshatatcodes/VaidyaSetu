# MediSahayak — Deterministic E2E Demo Script (SIH 2026)

Rehearse this exact path. Do not improvise live.

## Prep
1. Backend: `cd backend && npm start` (MongoDB connected)
2. Frontend: `cd frontend && npm run dev`
3. Open `/kiosk-terminal` (kiosk) and `/doctor` (doctor) + `/queue-board/Kayachikitsa` (waiting room)

## Script (Hindi voice / touch path)
1. **Consent** — enable data capture + doctor sharing; continue
2. **Language** — select हिन्दी
3. **Identity** — name `सीमा देवी`, age `45`, Female, ABHA optional blank or demo
4. **Chief complaint** — tap **Chest pain** icon OR say "छाती में दर्द"
5. **Body map** — tap Chest
6. **SOCRATES** — answer onset/character/severity; confirm **RED-FLAG** banner + `triagePriority: emergency`
7. **Vitals** — optional; or simulate SpO2 97
8. **Dashavidha** — skip or fill Agni only (no auto Prakriti claim)
9. **Documents** — scan/upload printed Rx image → confirm "Paracetamol 500mg — Yes"
10. **Token** — generate SOAP → show token + **Generate QR** → print slip (no diagnosis text)
11. **Queue board** — emergency token surfaces first; audio announcement
12. **Doctor** — open token → banner **"AI-generated draft — physician verification required"** → edit one SOAP line → Accept evidence → Approve
13. **FHIR stub** — Download FHIR / push-his shows ABDM-shaped bundle

## Pass criteria
- Illiterate path: touch + voice only for complaint + SOCRATES
- Red-flag immediately reprioritises token
- OCR facts appear in evidence panel with confidence
- Doctor commit closes loop
- `/api/diseases` returns 410 (legacy hidden)
