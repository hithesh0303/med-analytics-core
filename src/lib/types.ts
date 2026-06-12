export type Role = "admin" | "doctor" | "analyst";

export type Gender = "Male" | "Female" | "Other";

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  bloodGroup: string;
  contact: string;
  disease: string;
  treatment: string;
  admissionDate: string; // ISO
  cost?: number;
  visitCount?: number;
}

export type DiseaseModel = "diabetes" | "heart" | "stroke";

export interface PredictionInput {
  age: number;
  gender: Gender;
  bmi: number;
  bloodPressure: number;
  glucose: number;
  smoking: boolean;
}

export interface PredictionResult {
  model: DiseaseModel;
  algorithm: "Decision Tree" | "Random Forest" | "Logistic Regression";
  risk: number; // 0..1
  category: "Low" | "Moderate" | "High";
  timestamp: string;
}
