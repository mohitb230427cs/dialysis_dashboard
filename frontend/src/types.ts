import { z } from "zod";

export const PatientSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().min(2, "Name is too short"),
  age: z.number().min(0).max(120),
  gender: z.enum(["Male", "Female", "Other"]),
  dryWeight: z.number().positive(),
  unit: z.string().min(1),
  machineId: z.string().min(1),
  scheduledTime: z.string(),
});

export const SessionSchema = z.object({
  id: z.string().optional(),
  patientId: z.string(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  preWeight: z.number().positive(),
  postWeight: z.number().positive().optional(),
  preSystolicBP: z.number().positive(),
  postSystolicBP: z.number().positive().optional(),
  nurseNotes: z.string(),
  status: z.enum(["not started", "in progress", "completed"]),
});

export const PatientRegistrationSchema = z.object({
  fullName: z.string().min(2, "Full name is required (min 2 characters)"),
  age: z.number().min(1, "Age must be at least 1").max(120, "Age cannot exceed 120"),
  gender: z.enum(["Male", "Female", "Other"]),
  dryWeight: z.number().positive("Dry weight must be a positive number"),
  unit: z.string().min(1, "Unit is required"),
  machineId: z.string().min(1, "Machine ID is required"),
  scheduledTime: z.string().min(1, "Scheduled time is required"),
});

export type Patient = z.infer<typeof PatientSchema>;
export type PatientRegistration = z.infer<typeof PatientRegistrationSchema>;
export type Session = z.infer<typeof SessionSchema>;

export interface ScheduleItem {
  patient: Patient;
  session: Session | null;
  anomalies: string[];
  status: string;
  machineId: string;
}
