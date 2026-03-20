import { ANOMALY_CONFIG } from '../config/anomaly.js';

export function validateSession(session: any, patient: any): string | null {
  const { preWeight, postWeight, preSystolicBP, postSystolicBP, startTime, endTime } = session;

  if (preWeight < 30 || preWeight > 200) return 'Pre-Weight must be between 30 and 200 kg';

  if (postWeight !== undefined && postWeight !== null) {
    if (postWeight < 30 || postWeight > 200) return 'Post-Weight must be between 30 and 200 kg';
    if (postWeight > preWeight) return 'Post-weight cannot exceed pre-weight';
    if (preWeight - postWeight > 5) return 'Maximum fluid removal allowed is 5 kg';
  }

  if (preSystolicBP < 80 || preSystolicBP > 200) {
    return 'Pre Systolic BP must be between 80 and 200 mmHg';
  }

  if (postSystolicBP !== undefined && postSystolicBP !== null) {
    if (postSystolicBP < 80 || postSystolicBP > 200) {
      return 'Post Systolic BP must be between 80 and 200 mmHg';
    }
  }

  if (!startTime) return 'Start time is required';

  if (endTime) {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const diffMinutes = (end - start) / (1000 * 60);

    if (end <= start) return 'End time must be after start time';
    if (diffMinutes < 30 || diffMinutes > 360) {
      return 'Session duration must be between 30 minutes and 6 hours';
    }
  }

  if (!patient || !patient.machineId || !patient.unit) {
    return 'Patient clinical data (Machine/Unit) is missing';
  }

  return null;
}

export function detectAnomalies(session: any, patient: any): string[] {
  const anomalies: string[] = [];

  if (session.preWeight - patient.dryWeight > ANOMALY_CONFIG.WEIGHT_GAIN_THRESHOLD) {
    anomalies.push('Excess interdialytic weight gain');
  }

  if (session.postSystolicBP && session.postSystolicBP > ANOMALY_CONFIG.HIGH_BP_THRESHOLD) {
    anomalies.push('High post-dialysis systolic BP');
  }

  if (session.startTime && session.endTime) {
    const start = new Date(session.startTime).getTime();
    const end = new Date(session.endTime).getTime();
    const durationMinutes = (end - start) / (1000 * 60);

    if (
      durationMinutes < ANOMALY_CONFIG.MIN_DURATION ||
      durationMinutes > ANOMALY_CONFIG.MAX_DURATION
    ) {
      anomalies.push('Abnormal session duration');
    }
  }

  return anomalies;
}
