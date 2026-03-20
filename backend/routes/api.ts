import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { PatientModel } from '../models/Patient.js';
import { SessionModel } from '../models/Session.js';
import { detectAnomalies, validateSession } from '../services/sessionRules.js';

const patientCreateSchema = z.object({
  fullName: z.string().min(2),
  age: z.number().int().min(1).max(120),
  gender: z.enum(['Male', 'Female', 'Other']),
  dryWeight: z.number().positive(),
  unit: z.string().min(1),
  machineId: z.string().min(1),
  scheduledTime: z.string().min(1),
});

const sessionCreateSchema = z.object({
  patientId: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().optional().nullable(),
  preWeight: z.number(),
  postWeight: z.number().optional().nullable(),
  preSystolicBP: z.number(),
  postSystolicBP: z.number().optional().nullable(),
  nurseNotes: z.string().default(''),
  status: z.enum(['not started', 'in progress', 'completed']).optional(),
});

const sessionPatchSchema = sessionCreateSchema.partial().extend({
  nurseNotes: z.string().optional(),
  status: z.enum(['not started', 'in progress', 'completed']).optional(),
});

function serializeDocument<T>(doc: T): T {
  return JSON.parse(JSON.stringify(doc));
}

function buildTodaySessionTime(date: Date, hour: number, minute: number): string {
  const value = new Date(date);
  value.setHours(hour, minute, 0, 0);
  return value.toISOString();
}

export function createApiRouter() {
  const router = Router();

  router.use((req, res, next) => {
    if (mongoose.connection.readyState !== 1 && req.path !== '/health') {
      return res.status(503).json({
        error:
          'Database not connected. Please ensure your MONGODB_URI is correct and MongoDB Atlas network access is configured.',
      });
    }
    next();
  });

  router.get('/health', (_req, res) => {
    const ready = mongoose.connection.readyState === 1;
    res.status(ready ? 200 : 503).json({
      ok: ready,
      status: ready ? 'ready' : 'starting',
      timestamp: new Date().toISOString(),
    });
  });

  router.post('/seed', async (_req, res) => {
    try {
      await SessionModel.deleteMany({});
      await PatientModel.deleteMany({});

      const seededPatients = await PatientModel.insertMany([
        { fullName: 'John Doe', age: 65, gender: 'Male', dryWeight: 75.0, unit: 'A', machineId: 'M-101', scheduledTime: '08:00' },
        { fullName: 'Jane Smith', age: 58, gender: 'Female', dryWeight: 62.5, unit: 'A', machineId: 'M-102', scheduledTime: '08:30' },
        { fullName: 'Robert Brown', age: 72, gender: 'Male', dryWeight: 82.0, unit: 'B', machineId: 'M-201', scheduledTime: '09:00' },
        { fullName: 'Alice Johnson', age: 45, gender: 'Female', dryWeight: 55.0, unit: 'B', machineId: 'M-202', scheduledTime: '09:30' },
        { fullName: 'Michael Wilson', age: 80, gender: 'Male', dryWeight: 88.0, unit: 'C', machineId: 'M-301', scheduledTime: '10:00' },
        { fullName: 'Sarah Davis', age: 62, gender: 'Female', dryWeight: 68.0, unit: 'C', machineId: 'M-302', scheduledTime: '10:30' },
        { fullName: 'David Miller', age: 54, gender: 'Male', dryWeight: 78.0, unit: 'A', machineId: 'M-103', scheduledTime: '11:00' },
      ]);

      const now = new Date();

      await SessionModel.insertMany([
        {
          patientId: seededPatients[0]._id,
          startTime: buildTodaySessionTime(now, 8, 0),
          endTime: buildTodaySessionTime(now, 12, 0),
          preWeight: 76.5,
          postWeight: 75.2,
          preSystolicBP: 130,
          postSystolicBP: 125,
          nurseNotes: 'Routine session, no issues.',
          status: 'completed',
        },
        {
          patientId: seededPatients[1]._id,
          startTime: buildTodaySessionTime(now, 8, 30),
          preWeight: 66.0,
          preSystolicBP: 135,
          nurseNotes: 'Significant fluid retention noted pre-session.',
          status: 'in progress',
        },
        {
          patientId: seededPatients[2]._id,
          startTime: buildTodaySessionTime(now, 9, 0),
          endTime: buildTodaySessionTime(now, 13, 0),
          preWeight: 83.0,
          postWeight: 82.1,
          preSystolicBP: 140,
          postSystolicBP: 155,
          nurseNotes: 'Patient reported headache towards end of session.',
          status: 'completed',
        },
        {
          patientId: seededPatients[3]._id,
          startTime: buildTodaySessionTime(now, 9, 30),
          endTime: buildTodaySessionTime(now, 11, 30),
          preWeight: 56.0,
          postWeight: 55.1,
          preSystolicBP: 120,
          postSystolicBP: 118,
          nurseNotes: 'Session terminated early due to patient discomfort.',
          status: 'completed',
        },
        {
          patientId: seededPatients[4]._id,
          startTime: buildTodaySessionTime(now, 10, 0),
          endTime: buildTodaySessionTime(now, 14, 0),
          preWeight: 92.0,
          postWeight: 88.5,
          preSystolicBP: 150,
          postSystolicBP: 165,
          nurseNotes: 'Complex session with multiple clinical concerns.',
          status: 'completed',
        },
        {
          patientId: seededPatients[5]._id,
          startTime: buildTodaySessionTime(now, 10, 30),
          preWeight: 69.5,
          preSystolicBP: 125,
          nurseNotes: 'Session proceeding normally.',
          status: 'in progress',
        },
      ]);

      res.json({ message: 'Database seeded successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/patients', async (_req, res) => {
    try {
      const patients = await PatientModel.find({}).sort({ createdAt: 1 }).lean({ virtuals: true });
      res.json(serializeDocument(patients));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/patients', async (req, res) => {
    try {
      const payload = patientCreateSchema.parse(req.body);
      const patient = await PatientModel.create(payload);
      res.status(201).json(serializeDocument(patient));
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues[0]?.message ?? 'Invalid patient data' });
      }
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/sessions', async (req, res) => {
    try {
      const payload = sessionCreateSchema.parse(req.body);
      const patient = await PatientModel.findById(payload.patientId);

      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      const validationError = validateSession(payload, patient);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      const session = await SessionModel.create({
        ...payload,
        status: payload.status ?? 'not started',
      });

      res.status(201).json(serializeDocument(session));
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues[0]?.message ?? 'Invalid session data' });
      }
      res.status(500).json({ error: error.message });
    }
  });

  router.patch('/sessions/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const patch = sessionPatchSchema.parse(req.body);
      const session = await SessionModel.findById(id);

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const merged = { ...serializeDocument(session), ...patch };
      const patient = await PatientModel.findById(merged.patientId);
      const validationError = validateSession(merged, patient);

      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      Object.assign(session, patch);
      await session.save();
      res.json(serializeDocument(session));
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues[0]?.message ?? 'Invalid session update' });
      }
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/schedule/today', async (req, res) => {
    try {
      const unit = typeof req.query.unit === 'string' ? req.query.unit : undefined;
      const patients = await PatientModel.find(unit ? { unit } : {}).sort({ scheduledTime: 1 }).lean({ virtuals: true });

      const patientIds = patients.map((patient: any) => patient._id);
      const sessions = await SessionModel.find({ patientId: { $in: patientIds } })
        .sort({ createdAt: -1 })
        .lean({ virtuals: true });

      const latestSessions = new Map<string, any>();
      for (const session of sessions) {
        const key = session.patientId.toString();
        if (!latestSessions.has(key)) {
          latestSessions.set(key, session);
        }
      }

      const schedule = patients.map((patient: any) => {
        const session = latestSessions.get(patient._id.toString()) ?? null;
        const anomalies = session ? detectAnomalies(session, patient) : [];

        return {
          patient: serializeDocument(patient),
          session: session ? serializeDocument(session) : null,
          anomalies,
          status: session?.status ?? 'not started',
          machineId: patient.machineId,
        };
      });

      res.json(schedule);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
