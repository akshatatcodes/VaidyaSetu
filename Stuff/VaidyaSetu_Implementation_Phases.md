# VaidyaSetu: Implementation Phases & Build Order 🚀

This document outlines the strict execution roadmap for integrating the 3-Layer Core Engine and the 4 Supporting Modules into a complete, presentation-ready product.

---

### 🔥 STRATEGIC BUILD ORDER

Follow this EXACT order to ensure momentum and avoid technical blockers.

#### 1️⃣ Phase 1: Authentication & Professional Dashboard UI
*Get the foundation working first.*
* **Objective:** Build a premium health dashboard and persistent user storage.
* **Tasks:**
  * Implement Authentication (e.g., Firebase Auth or NextAuth) so users can create accounts.
  * Setup a cloud database (MongoDB Atlas) to persistently store user vitals, uploaded prescriptions, and past reports.
  * Build a professional Dashboard layout (Sidebar navigation, Health Timeline, Active Medicines list, and dynamic Risk Gauges).

#### 2️⃣ Phase 2: Static Engine (Disease + Advice)
*Build the Core Engine (Layers 1, 2, 3) using static rules.*
* **Objective:** Implement the Rule Engine using local JSON databases.
* **Tasks:**
  * Define `Disease DB` (Focus on Diabetes, Hypertension, Anemia).
  * Define `Medicine DB` and `Interaction DB` (Sourced from **IMPPAT**, **TKDL (Traditional Knowledge Digital Library)**, Official **Ministry of AYUSH** records, and **PubChem**).
  * Write the logic that cross-references a user's input with the JSON databases to trigger warnings. Do not use AI yet.

#### 3️⃣ Phase 3: AI Interpretation Integration
*Add the 🟪 AI Interpretation Layer.*
* **Objective:** Use Llama-3 via Groq to explain the rigid JSON outputs.
* **Tasks:**
  * Pass the triggered JSON warnings and safe remedies to Groq.
  * Prompt the LLM to output the "WHY" (e.g., explaining biological pathway conflicts).
  * Return this human-readable explanation to the user interface.

#### 4️⃣ Phase 4: Medicine Input Engine
*Add the 🟨 Input Processing System (Manual pass).*
* **Objective:** Allow users to accurately list their medications.
* **Tasks:**
  * Set up manual text inputs for Prescriptions and typed Medicine Names.
  * Implement the Medicine Parser that matches the user's string to the `Medicine DB`.

#### 5️⃣ Phase 5: Smart OCR (Image Upload)
*Upgrading the Input Processing System.*
* **Objective:** Automate prescription reading via image upload.
* **Tasks:**
  * Implement image upload on the React frontend.
  * Use an LLM Vision model (or targeted OCR API) to extract the text and parse it directly into medicine arrays.
  * Fallback to manual entry if OCR fails.

#### 6️⃣ Phase 6: Automatic Report Generation
*Add the 🟧 Smart Report Generator.*
* **Objective:** Give the user (and the judges) a physical takeaway.
* **Tasks:**
  * Compile Patient Info, Disease Summary, Medicines Detected, Do's/Don'ts, and AYUSH advice.
  * Generate a highly structured, professional PDF right from the React frontend or Node.js.

#### 7️⃣ Phase 7: Multilingual Output
*Add the 🌐 Multilingual Engine.*
* **Objective:** Accessibility.
* **Tasks:**
  * Modify the Groq prompt or add a translation API to dynamically output the exact same report and warnings in Hindi and Marathi.
  * Add language toggles to the UI.

---
### ⚠️ Key Development Restrictions
* **FOCUS**: Limit to 3-5 major diseases. Do not try for perfect medical accuracy; focus on the interaction pipeline.
* **HYBRID LOGIC**: Always prioritize static Rules (JSON DB) for safety flags to avoid AI hallucinations. AI is for *explanation*, not *diagnosis base-truths*.
