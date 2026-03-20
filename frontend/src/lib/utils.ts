import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API_BASE = "/api";

async function handleResponse(res: Response) {
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || "API Error");
    return data;
  } else {
    const text = await res.text();
    // Check if it's the AI Studio warmup page
    if (text.includes("<!DOCTYPE html>") || text.includes("<html")) {
      throw new Error("Backend is not ready yet. Please wait and reload.");
    }
    if (!res.ok) throw new Error(text || "Server Error");
    return text;
  }
}

export const api = {
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      const data = await handleResponse(res);
      return data.ok === true;
    } catch (e) {
      return false;
    }
  },
  async seed() {
    const res = await fetch(`${API_BASE}/seed`, { method: "POST" });
    return handleResponse(res);
  },
  async getSchedule(unit?: string) {
    const url = unit ? `${API_BASE}/schedule/today?unit=${unit}` : `${API_BASE}/schedule/today`;
    const res = await fetch(url);
    return handleResponse(res);
  },
  async registerPatient(patient: any) {
    const res = await fetch(`${API_BASE}/patients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patient),
    });
    return handleResponse(res);
  },
  async createSession(session: any) {
    const res = await fetch(`${API_BASE}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(session),
    });
    return handleResponse(res);
  },
  async updateSession(id: string, data: any) {
    const res = await fetch(`${API_BASE}/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  }
};
