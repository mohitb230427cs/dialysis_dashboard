# Dialysis Session Intake & Anomaly Dashboard

A full-stack healthcare dashboard for dialysis center staff to register patients, record session metrics, and surface clinical anomalies in real time.

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

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express, Mongoose
- **Validation:** Zod
- **UI:** Lucide React, Motion
- **Database:** MongoDB Atlas / MongoDB

## Features

- Register patients with dialysis-specific clinical details
- Record session metrics: weights, systolic BP, timing, notes, status
- Automatic anomaly detection:
  - Excess interdialytic weight gain
  - High post-dialysis systolic BP
  - Abnormal session duration
- Seed demo data for fast review
- Frontend and backend validation with clear error feedback
- MongoDB persistence instead of in-memory storage

## Anomaly rules

- **Excess weight gain:** `preWeight - dryWeight > 2.5 kg`
- **High post-dialysis BP:** `postSystolicBP > 140 mmHg`
- **Abnormal duration:** session duration `< 3h` or `> 5h`

These thresholds are engineering assumptions for demo purposes.

## Validation rules

- Weight range: 30–200 kg
- Post-weight must be less than or equal to pre-weight
- Maximum fluid removal: 5 kg
- BP range: 80–200 mmHg
- End time must be after start time
- Duration must be between 30 minutes and 6 hours

## API endpoints

- `GET /api/health`
- `POST /api/seed`
- `GET /api/patients`
- `POST /api/patients`
- `POST /api/sessions`
- `PATCH /api/sessions/:id`
- `GET /api/schedule/today`

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Copy environment file:

```bash
cp .env.example .env
```

3. Fill in your MongoDB connection string in `.env`.

4. Start the app:

```bash
npm run dev
```

5. Open:

```text
http://localhost:3000
```

## Testing

```bash
npm test
```

## Notes

- The backend waits for MongoDB before serving requests.
- `/api/health` reports backend readiness.
- The API continues to return the same schedule shape expected by the current frontend.
