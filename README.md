# Dialysis Session Intake & Anomaly Dashboard

A full-stack healthcare dashboard for dialysis center staff to register patients, record session metrics, and surface clinical anomalies in real time.

---

## Project structure

```text
.
├── backend/
│   ├── config/
│   │   ├── anomaly.ts
│   │   └── db.ts
│   ├── models/
│   │   ├── Patient.ts
│   │   └── Session.ts
│   ├── routes/
│   │   └── api.ts
│   ├── services/
│   │   └── sessionRules.ts
│   └── server.ts
├── frontend/
│   ├── index.html
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── types.ts
│       ├── logic.test.ts
│       ├── lib/
│       │   └── utils.ts
│       └── components/
│           ├── PatientRegistrationForm.tsx
│           └── UI.tsx
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Tech stack

* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
* **Backend:** Node.js, Express, Mongoose
* **Validation:** Zod
* **UI:** Lucide React, Motion
* **Database:** MongoDB Atlas / MongoDB

---

## Architecture overview

* **Frontend (React):** Handles UI, form input, and API communication
* **Backend (Express):** Exposes REST APIs and enforces validation
* **Models (Mongoose):** Defines Patient and Session schemas
* **Services (`sessionRules.ts`):** Contains business logic (validation + anomaly detection)
* **Database (MongoDB):** Stores persistent patient and session data

👉 Clear separation of concerns:

* UI → API → Business Logic → Database

---

## Features

* Register patients with dialysis-specific clinical details
* Record session metrics:

  * Weights
  * Systolic BP
  * Timing
  * Notes
  * Status
* Automatic anomaly detection:

  * Excess interdialytic weight gain
  * High post-dialysis systolic BP
  * Abnormal session duration
* Seed demo data for fast review
* Frontend and backend validation with clear error feedback
* MongoDB persistence (no in-memory storage)

---

## Anomaly rules

* **Excess weight gain:** `preWeight - dryWeight > 2.5 kg`
* **High post-dialysis BP:** `postSystolicBP > 140 mmHg`
* **Abnormal duration:** session duration `< 3h` or `> 5h`

> These thresholds are engineering assumptions for demonstration purposes.

---

## Validation rules

* Weight range: 30–200 kg
* Post-weight ≤ pre-weight
* Maximum fluid removal: 5 kg
* BP range: 80–200 mmHg
* End time must be after start time
* Duration must be between 30 minutes and 6 hours

---

## API endpoints

* `GET /api/health`
* `POST /api/seed`
* `GET /api/patients`
* `POST /api/patients`
* `POST /api/sessions`
* `PATCH /api/sessions/:id`
* `GET /api/schedule/today`

---

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Copy environment file:

```bash
cp .env.example .env
```

3. Add your MongoDB connection string in `.env`

4. Start the app:

```bash
npm run dev
```

5. Open:

```text
http://localhost:3000
```

---

## Testing

```bash
npm test
```

---

## Assumptions & Trade-offs

* Clinical thresholds are simplified for demo purposes
* No authentication or user roles implemented
* Focus is on core workflow (patient → session → anomaly) rather than full production system
* MongoDB chosen for simplicity and flexibility

---

## Limitations

* No role-based access control
* No pagination for large datasets
* No real-time updates (polling only)
* Limited test coverage (focused on core logic only)

---

## AI Usage

* Used AI tools for initial scaffolding and debugging
* Manually reviewed and refined:

  * Validation logic
  * Anomaly detection rules
  * API structure
* Adjusted error handling and UI behavior based on testing
* Ensured final code reflects understanding of system design

---

## Notes

* Backend waits for MongoDB connection before serving requests
* `/api/health` can be used to check readiness
* `/api/seed` provides demo data for quick testing
* API responses are structured to match frontend expectations

---
