# VaidyaSetu Platform API Documentation
*Version: 1.2.0-Alpha*

This document provides a technical specification of the VaidyaSetu core backend endpoints. The system relies on Node/Express and connects to a MongoDB Atlas cluster. All endpoints are prefixed with `/api`.

> [!NOTE]
> Authentication is handled via Clerk. Most routes expect a `clerkId` param or body field for contextual lookups. In a production environment, requests should supply the secure JWT Bearer token.

---

## 1. Interaction & Safety Bridge (`/api/interaction` | `/api/rag`)

### `POST /api/rag/check-safety`
**Description**: Triggers the Llama-3 (Groq) engine to cross-reference an array of medicines against allopathic and AYUSH contraindications.
**Payload**:
```json
{
  "clerkId": "string",
  "medicines": ["Aspirin", "Ashwagandha"],
  "language": "English | Hindi | Marathi"
}
```
**Returns**: `report` object containing `status` (CAUTION, DANGEROUS, CLEAR) and an `interactions` array detailing severity, mechanism, and recommendations.

### `POST /api/interaction/explain-interaction`
**Description**: Generates a layman's "Explain like I'm 5" summary of complex interaction mechanics.
**Payload**: `{ "drug1": "String", "drug2": "String" }`

---

## 2. Vitals Telemetry (`/api/vitals`)

### `GET /api/vitals/latest/:clerkId`
**Description**: Fetches the most recent vital submissions sorted by timestamp descending.
**Returns**: Array of `VitalsLog` documents.

### `POST /api/vitals/log`
**Description**: Saves a new biometric vital record.
**Payload**:
```json
{
  "clerkId": "user_id_here",
  "type": "blood_pressure | heart_rate | blood_glucose",
  "value": { "systolic": 120, "diastolic": 80 },
  "unit": "mmHg"
}
```

---

## 3. Alerts Hub (`/api/alerts`)

### `GET /api/alerts/:clerkId?status=unread&priority=critical`
**Description**: Retrieves chronologically sorted alerts matching optional query filters.

### `POST /api/alerts`
**Description**: Internal/External hook to push an immediate alert notification to a user's dashboard.
**Payload**:
```json
{
  "clerkId": "string",
  "type": "INTERACTION | LAB_DUE",
  "priority": "critical | high | medium",
  "title": "string",
  "description": "string"
}
```

---

## 4. OCR Vision Engine (`/api/ocr`)

### `POST /api/ocr/scan`
**Description**: Consumes `multipart/form-data` image upload. Runs a hybrid analysis using Gemini Vision, Groq Fallback, and Tesseract local processing to extract structured medication lists.

### `POST /api/ocr/normalize`
**Description**: Standardizes raw OCR outputs into correct pharmaceutical generic names via Fuzzy Matching against local/external databases.

---

## 5. Security & Governance (`/api/governance`)

### `DELETE /api/governance/purge/:clerkId`
**Description**: Triggers the "Permanent Purge" protocol. Irreversibly deletes all collections associated with the `clerkId` (Vitals, Reports, History, Preferences) ensuring Data Sovereignty compliance.

### `GET /api/governance/export/:clerkId`
**Description**: Returns a structured JSON dump of the user's entire biometric and algorithmic history.
