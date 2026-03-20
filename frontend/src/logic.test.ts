import { describe, it, expect } from 'vitest';

// Mocking the anomaly detection logic for testing
const ANOMALY_CONFIG = {
  WEIGHT_GAIN_THRESHOLD: 2.5,
  HIGH_BP_THRESHOLD: 140,
  MIN_DURATION: 180,
  MAX_DURATION: 300,
};

function detectAnomalies(session: any, patient: any) {
  const anomalies: string[] = [];
  
  if (session.preWeight - patient.dryWeight > ANOMALY_CONFIG.WEIGHT_GAIN_THRESHOLD) {
    anomalies.push("Excess interdialytic weight gain");
  }

  if (session.postSystolicBP && session.postSystolicBP > ANOMALY_CONFIG.HIGH_BP_THRESHOLD) {
    anomalies.push("High post-dialysis systolic BP");
  }

  if (session.startTime && session.endTime) {
    const start = new Date(session.startTime).getTime();
    const end = new Date(session.endTime).getTime();
    const durationMinutes = (end - start) / (1000 * 60);
    
    if (durationMinutes < ANOMALY_CONFIG.MIN_DURATION || durationMinutes > ANOMALY_CONFIG.MAX_DURATION) {
      anomalies.push("Abnormal session duration");
    }
  }

  return anomalies;
}

describe('Anomaly Detection Logic', () => {
  it('should detect excess weight gain', () => {
    const patient = { dryWeight: 70 };
    const session = { preWeight: 73 }; // 3kg gain > 2.5kg threshold
    const result = detectAnomalies(session, patient);
    expect(result).toContain("Excess interdialytic weight gain");
  });

  it('should detect high post-dialysis systolic BP', () => {
    const patient = { dryWeight: 70 };
    const session = { preWeight: 71, postSystolicBP: 145 }; // 145 > 140 threshold
    const result = detectAnomalies(session, patient);
    expect(result).toContain("High post-dialysis systolic BP");
  });

  it('should detect abnormal session duration', () => {
    const patient = { dryWeight: 70 };
    const session = { 
      preWeight: 71, 
      startTime: "2026-03-19T08:00:00Z", 
      endTime: "2026-03-19T10:00:00Z" // 120 mins < 180 threshold
    };
    const result = detectAnomalies(session, patient);
    expect(result).toContain("Abnormal session duration");
  });

  it('should return empty array when no anomalies exist', () => {
    const patient = { dryWeight: 70 };
    const session = { 
      preWeight: 71, 
      postSystolicBP: 130,
      startTime: "2026-03-19T08:00:00Z", 
      endTime: "2026-03-19T12:00:00Z" // 240 mins - Normal
    };
    const result = detectAnomalies(session, patient);
    expect(result).toHaveLength(0);
  });
});
