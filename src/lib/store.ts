import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Patient, PredictionResult, Role } from "./types";
import { generateSamplePatients } from "./sample-data";

interface EtlRun {
  id: string;
  filename: string;
  processed: number;
  loaded: number;
  duplicates: number;
  missingFilled: number;
  status: "success" | "error";
  timestamp: string;
}

interface State {
  role: Role;
  setRole: (r: Role) => void;

  patients: Patient[];
  addPatient: (p: Patient) => void;
  updatePatient: (id: string, p: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  bulkAdd: (p: Patient[]) => void;

  predictions: PredictionResult[];
  addPrediction: (p: PredictionResult) => void;

  etlRuns: EtlRun[];
  addEtlRun: (r: EtlRun) => void;
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      role: "admin",
      setRole: (role) => set({ role }),

      patients: generateSamplePatients(60),
      addPatient: (p) => set((s) => ({ patients: [p, ...s.patients] })),
      updatePatient: (id, patch) =>
        set((s) => ({ patients: s.patients.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deletePatient: (id) =>
        set((s) => ({ patients: s.patients.filter((x) => x.id !== id) })),
      bulkAdd: (arr) => set((s) => ({ patients: [...arr, ...s.patients] })),

      predictions: [],
      addPrediction: (p) =>
        set((s) => ({ predictions: [p, ...s.predictions].slice(0, 200) })),

      etlRuns: [],
      addEtlRun: (r) => set((s) => ({ etlRuns: [r, ...s.etlRuns].slice(0, 50) })),
    }),
    { name: "hdw-store-v1" },
  ),
);
