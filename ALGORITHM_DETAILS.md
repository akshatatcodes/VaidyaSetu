# VaidyaSetu: Algorithm & Predictive Model Documentation

This document provides a detailed technical explanation of the regression models, algorithms, and calculation logic used in the VaidyaSetu health risk assessment engine.

---

## 1. Hybrid Risk Architecture
VaidyaSetu employs a **Dual-Layer Hybrid Model** to ensure both medical reliability and real-time responsiveness.

1.  **Layer 1: Deterministic Engine (Baseline & Questionnaire)**
    - Uses validated medical scoring systems (e.g., IDRS).
    - Calculates a stable risk anchor based on long-term factors (age, genetics, lifestyle).
2.  **Layer 2: AI-Predictive Layer (Dynamic Adjustment)**
    - Uses Large Language Models (LLM) and real-time vitals.
    - Adjusts risk daily based on heart rate, blood pressure, activity, and sleep.

---

## 2. Core Deterministic Algorithms

### 2.1 Indian Diabetes Risk Score (IDRS)
Used for **Diabetes** and **Pre-Diabetes** risk assessment. This is a validated clinical tool for the Indian population.

| Factor | Criteria | Points |
| :--- | :--- | :--- |
| **Age** | < 35 | 0 |
| | 35 - 49 | 20 |
| | ≥ 50 | 30 |
| **Waist (Male)** | < 90 cm | 0 |
| | 90 - 99 cm | 10 |
| | ≥ 100 cm | 20 |
| **Waist (Female)** | < 80 cm | 0 |
| | 80 - 89 cm | 10 |
| | ≥ 90 cm | 20 |
| **Physical Activity** | Regular/Active | 0 |
| | Occasional/Moderate | 10 |
| | Sedentary (No exercise) | 20 |
| **Family History** | No parents | 0 |
| | One parent/sibling | 10 |
| | Both parents | 20 |

**Calculation:** Total IDRS Points + Symptom Modifiers (e.g., +8 for Frequent Thirst).

### 2.2 Likelihood Ratio Models (LR)
Used for conditions where specific symptoms significantly shift the probability (e.g., **Thyroid**).
- **Formula:** $Odds_{final} = Odds_{baseline} \times LR_{1} \times LR_{2} \dots$
- **Example (Thyroid):**
    - Baseline: Population prevalence (stratified by age/gender).
    - Persistent Fatigue: $\times 1.5$
    - Cold Sensitivity: $\times 2.0$
    - Dry Skin/Hair Loss: $\times 1.8$

---

## 3. AI-Predictive Adjustment Logic

The system utilizes the **Groq Llama-3-70B** model to perform "AI-First Predictive Adjustment." It follows a strict "Questionnaire-First" policy to prevent score volatility.

### 3.1 Vitals Impact Table
When daily vitals are recorded, the system applies the following deterministic deltas (or similar logic via LLM):

| Vital | Status | Risk Impact (Sample) |
| :--- | :--- | :--- |
| **Blood Pressure** | Critical (>181/121) | +25 (Hypertension), +20 (Stroke) |
| | High (>140/90) | +12 (Hypertension), +10 (Stroke) |
| **Blood Glucose** | Critical (>251) | +18 (Diabetes) |
| | High (>126) | +10 (Diabetes) |
| **Oxygen (SpO2)** | Critical (<90%) | +18 (COPD/Asthma) |
| **Sleep Duration** | Critical (<6 hrs) | +6 (Depression/Anxiety) |
| **Daily Steps** | Low (<5000) | +6 (Obesity/Diabetes) |

---

## 4. Regression Benchmark & Validation Pipeline
To ensure high accuracy (ROC AUC > 0.8), the project maintains an offline Python-based validation pipeline (`predictive_accuracy_pipeline.py`).

### 4.1 ML Algorithms Used
- **Logistic Regression:** Used for baseline linear probability modeling.
- **Random Forest:** Ensemble method used to capture non-linear feature interactions.
- **XGBoost (Extreme Gradient Boosting):** The primary model for high-stakes binary classification tasks (e.g., predicting outcome from the Pima Indians Diabetes Dataset).

### 4.2 Feature Engineering
Models calculate a **Metabolic Load Score** using the formula:
$$MetabolicLoad = 0.35 \times Glucose + 0.25 \times BMI + 0.20 \times DPF \times 100 + 0.20 \times Age$$
*(where DPF is Diabetes Pedigree Function)*

---

## 5. Step-by-Step Calculation Walkthrough

**Scenario:** A 40-year-old male, sedentary, with one diabetic parent, and a waist of 95cm.

1.  **Baseline IDRS Calculation:**
    - Age (40): **20 pts**
    - Waist (95cm): **10 pts**
    - Activity (Sedentary): **20 pts**
    - Family (One parent): **10 pts**
    - **Initial Score:** 60%
2.  **Symptom Adjustment:**
    - Reports "Blurred Vision": **+6 pts**
    - **Questionnaire Score:** 66%
3.  **Real-time Vitals Adjustment:**
    - Recorded BP is 145/95 (High): **+12 pts**
    - Recorded Sleep is 5.5 hrs: **+1 pt**
    - **Final Adjusted Risk:** 79% (Very High)
4.  **Mitigation Credit:**
    - Completes 3 "Dietary Changes": **-9 pts** (capped reduction)
    - **Display Score:** 70% (High)

---

## 6. Data Integrity & Sources
- **WHO GHO 2024:** Global Health Observatory prevalence data.
- **ICMR-INDIAB:** Indian Council of Medical Research (Diabetes/Hypertension benchmarks).
- **NFHS-5:** National Family Health Survey-5 data for Indian demographics.
- **Algorithm Version:** 2.1.0 (verified).

---

## 7. Detailed Datasets & Data Sources

The platform reaches a high degree of "Indian-specific" accuracy by using the following datasets:

### 7.1 Primary Clinical Datasets
| Dataset | Year | Application in VaidyaSetu |
| :--- | :--- | :--- |
| **ICMR-INDIAB (Phase III)** | 2023 | Gold standard for Diabetes (11.4%), Hypertension (35.5%), and Fatty Liver (35%) baselines. |
| **NFHS-5 (NHRC)** | 2021 | Primary source for Anemia (57.2%), Thyroid (2.9%), and Vitamin D/B12 deficiency baselines. |
| **WHO GHO** | 2024 | Global benchmarks for Heart Disease (2.8%), Stroke (1.8%), and Respiratory conditions. |
| **NMHS** | 2016 | National Mental Health Survey data for Depression (2.7%) and Anxiety (3.0%). |
| **ICMR-NCDIR** | 2023 | Specialized dataset for Asthma (2.4%) and COPD (4.2%) prevalence. |

### 7.2 Validation & Benchmarking Datasets (ML)
| Dataset | Source | Purpose |
| :--- | :--- | :--- |
| **Pima Indians Diabetes** | UCI Machine Learning Repository | Used in the Python validation pipeline to benchmark XGBoost and Random Forest against labeled real-world data. |
| **Indian Thyroid Society (ITS)** | Clinical Guidelines | Used to calibrate the Likelihood Ratio models for subclinical condition detection. |

### 7.3 Standardized Screening Tools
The engine incorporates the following standardized binary/choice datasets for symptom mapping:
- **PHQ-2 (Patient Health Questionnaire):** Mental health (Depression) screening.
- **GAD-2 (Generalized Anxiety Disorder):** Anxiety screening.
- **IDRS (Indian Diabetes Risk Score):** The core point-based dataset for metabolic risk.
