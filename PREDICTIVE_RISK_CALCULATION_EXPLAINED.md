# Predictive Risk Calculation Explained

This document explains how the current predictive-risk pipeline works in VaidyaSetu.

It covers:

- how the first dashboard risk score is created after onboarding
- how questionnaire answers recalculate the score
- how vitals, medications, allergies, and completed mitigations affect recalculation
- what AI is allowed to change
- worked percentage examples
- a sample prompt/output structure used by the AI scoring layer

## 1. Current Scoring Flow

The current backend flow is:

1. User completes onboarding.
2. Frontend calls `POST /api/reports/predictive-risk/init`.
3. Backend loads the user profile and computes a baseline predictive score for all supported diseases.
4. Dashboard reads saved values from `Report.risk_scores`.
5. When a disease card questionnaire is submitted, backend:
   - recalculates that disease immediately
   - saves the disease-specific result in `DiseaseInsight`
   - updates the card/report so the UI reflects the new value
6. When profile, vitals, meds, or mitigation completion change, a debounced background recompute runs through `schedulePredictiveRecompute(...)`.
7. That recompute persists updated scores back to:
   - `Report.risk_scores`
   - `Report.risk_score_meta`
   - `DiseaseInsight`

## 2. Main Rule: Three Score Stages

For each disease, the system now has three main numbers:

- `baselineScore`
- `questionnaireScore`
- `finalScore`

### 2.1 `baselineScore`

This is the score from onboarding/profile context only.

It is calculated from:

- demographic baseline prevalence from Indian datasets
- onboarding profile fields
- some disease-specific deterministic rules from `riskScorer.js`
- allergy/medication context where that disease rule supports it

### 2.2 `questionnaireScore`

This is the score after disease-specific questionnaire answers are merged into the user's profile for that disease.

This stage uses:

- onboarding/profile data
- questionnaire answers mapped into profile-like fields
- deterministic disease rules again

If questionnaire answers do not map to a disease rule, the backend falls back to questionnaire point totals and adds them on top of baseline, capped into the allowed risk range.

### 2.3 `finalScore`

This is the saved predictive score shown after the predictive AI layer finishes.

Rules:

- AI must keep `baselineScore` exactly equal to the deterministic baseline
- AI must keep `questionnaireScore` exactly equal to the deterministic questionnaire score
- AI can adjust only the `finalScore`
- AI is intended to use vitals/records context for that adjustment
- if AI fails or returns invalid JSON, backend falls back to deterministic `questionnaireScore`
- completed mitigation steps reduce the score after that

## 3. Exact Current Formula

At a high level, the code works like this:

```text
baselineScore = deterministic risk from onboarding/profile

questionnaireScore = deterministic risk after questionnaire answers are applied

aiAdjustedScore = AI final score using vitals/records context
or
aiAdjustedScore = questionnaireScore if AI is unavailable/invalid

mitigationReduction = min(15, completedMitigationCount * 3)

finalScore = clamp(aiAdjustedScore - mitigationReduction)
```

Where:

- `clamp(...)` means:
  - preserve `-1` for N/A
  - otherwise minimum `2`
  - maximum `95`
  - rounded to integer

## 4. Data Sources Used in Calculation

### 4.1 Stored prevalence baselines

Static prevalence baselines come from `backend/src/utils/prevalenceData.js`.

Examples:

- diabetes: `11.4`
- hypertension: `35.5`
- anemia overall: `57.2`
- anemia female baseline: `57.0`
- anemia male baseline: `25.0`

### 4.2 Runtime evidence

`backend/src/utils/evidenceProviders.js` attempts runtime WHO GHO lookups when configured for that disease.

Important:

- runtime evidence is currently used as evidence context for AI
- it does **not** directly replace deterministic baseline math in `riskScorer.js`
- if runtime fetch fails, the system falls back safely to stored prevalence data

### 4.3 User data considered

The predictive engine loads:

- `UserProfile`
- `Medication`
- `Vital`
- `DiseaseInsight`
- `MitigationCompletion`

So recalculation can use:

- onboarding/profile data
- allergies
- active medications
- questionnaire answers saved in profile/insight
- recent vitals
- completed mitigation steps

## 5. Example 1: Anemia Baseline After Onboarding

This example uses the **current code behavior**, not an idealized future version.

### Example user

- gender: female
- dietType: `Veg`
- no pale skin yet
- no brittle nails
- no dizziness
- no heavy menstrual flow
- no recent blood donation
- no questionnaire answered yet
- no mitigation completed

### Step A: pick baseline prevalence

From `prevalenceData.js`, anemia has:

- overall: `57.2`
- female: `57.0`
- male: `25.0`

For this example:

```text
baseline prevalence = 57
```

### Step B: add deterministic profile factors from `riskScorer.js`

Current anemia factors:

- Vegetarian Diet: `+15`
- Vegetarian/Vegan Diet: `+10`
- Family History of Anemia: `+10`
- Pale Skin Observation: `+12`
- Brittle Nails: `+7`
- Dizziness on Standing: `+8`
- Recent Blood Donation: `+6`
- Heavy Menstrual Flow: `+12`

In this example only `dietType = Veg` is true:

```text
57 baseline
+15 vegetarian diet
=72
```

### Step C: generic protective deductions

After disease-specific logic, `riskScorer.js` also applies generic deductions if true:

- healthy BMI: `-10`
- regular activity: `-15`
- non-smoker: `-20`

But the score is never allowed to go below the original disease baseline:

```text
score = max(baseline, adjustedScore)
```

So if the same user is:

- BMI in healthy range
- regular activity
- non-smoker

then:

```text
72
-10 healthy BMI
-15 regular activity
-20 non-smoker
=27

final deterministic baseline floor = max(57, 27) = 57
```

### Result for this example

```text
baselineScore = 57
```

This explains why a disease with a high Indian prevalence baseline like anemia may not drop below the baseline even if some general protective factors exist.

## 6. Example 2: Anemia After Questionnaire

Now the user opens the anemia card and answers questionnaire questions that map to:

- `paleSkinObservation = true`
- `recentBloodDonation = true`

The backend applies questionnaire answers into a profile-shaped object and recalculates the disease.

### Step A: start from the same baseline profile

```text
female anemia baseline = 57
vegetarian diet = +15
subtotal = 72
```

### Step B: add questionnaire-driven factors

From the anemia rule:

- Pale Skin Observation: `+12`
- Recent Blood Donation: `+6`

So:

```text
72
+12 pale skin
+6 recent blood donation
=90
```

### Step C: generic protections if present

If healthy BMI, regular activity, and non-smoker are all true:

```text
90
-10 healthy BMI
-15 regular activity
-20 non-smoker
=45

apply disease baseline floor:
max(57, 45) = 57
```

If those generic protections are not present:

```text
questionnaireScore = 90
```

### Key point

The actual number depends on the full current profile state, not only the new questionnaire answers.

So the disease score is effectively:

```text
questionnaireScore =
baseline prevalence
+ disease-specific onboarding factors
+ disease-specific questionnaire factors
- generic healthy BMI/activity/non-smoker deductions
then floored to at least baseline
then clamped to 2..95
```

## 7. Example 3: AI Final Score With Vitals/Records

After deterministic anchors are created, the predictive AI layer receives:

- `baselineScore`
- `questionnaireScore`
- top questionnaire factors
- latest vitals by type
- allergies
- active meds
- prevalence evidence
- completed mitigation count

### AI rules in current code

AI must obey these rules:

- do not change deterministic baseline
- do not change deterministic questionnaire score
- only adjust `finalScore`
- final score must be integer `2..95`
- if completed mitigations exist, final should be reduced relative to questionnaire score

### Worked example

Suppose deterministic values are:

```text
baselineScore = 57
questionnaireScore = 72
```

Then AI sees vitals or records suggesting slightly more concern and returns:

```json
{
  "finalScore": 76,
  "baselineScore": 57,
  "questionnaireScore": 72
}
```

If no mitigations are completed:

```text
finalScore = 76
assessmentDelta = 76 - 57 = 19
```

If 2 mitigation steps are completed:

```text
mitigationReduction = 2 * 3 = 6
finalScore = 76 - 6 = 70
assessmentDelta = 70 - 57 = 13
```

## 8. Example 4: Mitigation Completion

Mitigation completion currently works like this:

```text
each completed step = -3
maximum total reduction per disease = -15
```

Examples:

- 1 step complete: `-3`
- 2 steps complete: `-6`
- 3 steps complete: `-9`
- 5 or more steps complete: capped at `-15`

### Example

```text
AI/deterministic score before mitigation = 25
1 step completed = -3
new final score = 22
```

That exact scenario is covered by the anemia smoke test.

## 9. Questionnaire Recalculation Logic

When `POST /api/diseases/:diseaseId/questionnaire` is called, backend does this:

1. loads the saved DB profile
2. loads active medications
3. merges frontend payload with DB profile
4. builds questionnaire answer breakdown
5. computes deterministic `baselineInsights`
6. applies questionnaire answers onto a temporary profile object
7. computes deterministic `questionnaireInsights`
8. saves mapped questionnaire answers back into `UserProfile`
9. saves disease-specific insight into `DiseaseInsight`
10. attempts AI authoritative scoring for that disease
11. updates `Report.risk_scores[diseaseId]`
12. schedules background recompute for other predictive diseases

Important anti-jump rule:

- after questionnaire submission, the scheduler excludes the disease currently being updated
- this prevents the card from immediately changing again a second later due to a global recompute

## 10. What Gets Recomputed Automatically

Predictive risk recompute is triggered after:

- onboarding init
- profile save
- vitals add/update/delete
- medication add/take/delete
- disease questionnaire submission
- mitigation completion

The scheduler waits briefly and then recalculates the predictive diseases again.

## 11. AI Prompt Structure Example

Below is a simplified example of the prompt shape used by `predictiveRiskAiService.js`.

```text
You are VaidyaSetu AI, generating predictive disease risk scores for Indian users.
You MUST output strict JSON ONLY.

INPUTS:
- clerkId: user_123
- onboarding profile: { age, gender, bmi, dietType, allergies, ... }
- allergies: ["Penicillin"]
- activeMedications: ["Ferrous Ascorbate"]
- latestVitalsByType: {
    hemoglobin: { value: 10.2 },
    weight: { value: 58 }
  }
- diseaseDeterministicAnchors: [
    {
      diseaseId: "anemia",
      baselineScore: 57,
      questionnaireScore: 72,
      questionnaireFactorsTop: [
        { name: "Vegetarian Diet", impact: 15 },
        { name: "Pale Skin Observation", impact: 12 }
      ],
      missingDataCount: 1,
      hasQuestionnaire: true,
      completedMitigationCount: 2,
      prevalence: {
        stored: { overall: 57.2, sources: ["NFHS-5 2021", "ICMR"] }
      }
    }
  ]

RULES:
- baselineScore must remain 57
- questionnaireScore must remain 72
- finalScore must start from questionnaireScore
- adjust finalScore only using vitals/records context
- reduce finalScore if mitigation steps are completed
- output valid JSON only
```

## 12. AI Output Example

Example valid output:

```json
{
  "results": {
    "anemia": {
      "finalScore": 74,
      "baselineScore": 57,
      "questionnaireScore": 72,
      "assessmentDelta": 17,
      "riskCategory": "Moderate",
      "factorBreakdown": [
        {
          "id": "diet_veg",
          "name": "Vegetarian Diet",
          "displayValue": "Veg",
          "impact": 15,
          "direction": "increase",
          "explanation": "Lower absorption of non-heme iron.",
          "category": "lifestyle",
          "source": "user_profile"
        },
        {
          "id": "anemia_pallor",
          "name": "Pale Skin Observation",
          "displayValue": "Yes",
          "impact": 12,
          "direction": "increase",
          "explanation": "Pallor can be associated with reduced hemoglobin.",
          "category": "symptom",
          "source": "user_profile"
        },
        {
          "id": "vitals_adjustment",
          "name": "Vitals/Records adjustment",
          "displayValue": "Low hemoglobin record",
          "impact": 2,
          "direction": "increase",
          "explanation": "Recent hemoglobin values support a slightly higher anemia concern.",
          "category": "lab",
          "source": "records"
        }
      ],
      "protectiveFactors": [
        {
          "id": "mitigation_completed",
          "name": "Mitigation completed",
          "displayValue": "2 step(s)",
          "impact": 6,
          "direction": "decrease",
          "explanation": "Completed mitigation steps reduce risk according to predictive scoring policy.",
          "category": "lifestyle",
          "source": "mitigation_completion"
        }
      ],
      "missingDataFactors": [],
      "mitigationSteps": [
        {
          "id": "iron_foods",
          "title": "Increase iron-rich foods",
          "description": "Increase iron-rich meals and combine them with vitamin C sources.",
          "priority": "high",
          "category": "dietary",
          "isRegional": true
        }
      ],
      "precautions": [
        "Avoid skipping meals if fatigue is worsening."
      ],
      "verification": {
        "source": "NFHS-5 2021",
        "allSources": ["NFHS-5 2021", "ICMR"],
        "datasetVersion": "2024",
        "verificationLevel": "verified",
        "lastValidatedAt": "2026-04-16T00:00:00.000Z",
        "algorithmVersion": "predictive-risk-v1"
      }
    }
  }
}
```

## 13. Important Current Behavior Notes

These points matter if you are checking whether the numbers "feel correct":

- the deterministic baseline is still anchored by `riskScorer.js`
- the AI layer is **not** free to rewrite baseline and questionnaire anchors
- mitigations reduce score after the AI/deterministic score is created
- runtime WHO data currently acts as evidence context, not direct formula replacement
- the currently edited disease is excluded from background recompute right after questionnaire/add-data, to avoid score jumping

## 14. One Important Limitation In Current Logic

There is one subtle but important difference between "displayed protective factors" and "score deductions":

- some disease-specific protective factors are stored in `protectiveFactors`
- but not every protective factor is directly subtracted from the deterministic score

For example:

- `ironSupplementation` is added as a protective factor for anemia
- but the score-reduction logic in `riskScorer.js` currently applies generic deductions mainly for:
  - healthy BMI
  - regular activity
  - non-smoker

So when reviewing percentages, do not assume every displayed protective factor always changes the final numeric score by the same amount unless that deduction is explicitly applied in the active formula layer.

## 15. Manual Verification Status

Attempted manual browser verification found two blockers in the current local environment:

- app redirects to Clerk sign-in, so a real end-to-end dashboard check requires a valid login
- browser console is currently showing `Active Backend URL: https://vaidyasetu-eyg9.onrender.com/api`, which means a local frontend run is still picking the remote backend URL instead of local `http://localhost:5000/api`

So the code path is implemented, but a trustworthy local browser verification still requires:

1. signing in with a working test user
2. ensuring `VITE_API_URL` is not overriding local development

## 16. Short Summary

The current predictive-risk formula is:

```text
Onboarding/Profile -> deterministic baseline
Questionnaire -> deterministic questionnaire score
Vitals/records -> AI-adjusted final score
Mitigation completion -> final reduction
```

And the final stored values are persisted back into:

- `Report.risk_scores`
- `Report.risk_score_meta`
- `DiseaseInsight`

