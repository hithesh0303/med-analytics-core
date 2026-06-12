import type { Patient } from "./types";

const diseases = ["Diabetes", "Hypertension", "Heart Disease", "Stroke", "Asthma", "Arthritis", "Migraine", "Anemia"];
const treatments = ["Metformin", "Lisinopril", "Atorvastatin", "Aspirin", "Albuterol", "Ibuprofen", "Sumatriptan", "Iron supplement"];
const blood = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const firstNames = ["Aarav", "Priya", "Liam", "Olivia", "Noah", "Emma", "Ravi", "Sara", "Ethan", "Maya", "Kai", "Zara", "Omar", "Lina", "Yusuf", "Ada"];
const lastNames = ["Sharma", "Patel", "Johnson", "Garcia", "Kim", "Chen", "Khan", "Singh", "Brown", "Davis", "Wilson", "Moore"];

function rand<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }
function r(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

export function generateSamplePatients(n = 60): Patient[] {
  const out: Patient[] = [];
  for (let i = 0; i < n; i++) {
    const diseaseIdx = r(0, diseases.length - 1);
    const dateOffset = r(0, 330);
    const d = new Date();
    d.setDate(d.getDate() - dateOffset);
    out.push({
      id: `P${String(1000 + i)}`,
      name: `${rand(firstNames)} ${rand(lastNames)}`,
      age: r(5, 88),
      gender: rand(["Male", "Female", "Other"] as const),
      bloodGroup: rand(blood),
      contact: `+1 ${r(200, 999)}-${r(100, 999)}-${r(1000, 9999)}`,
      disease: diseases[diseaseIdx],
      treatment: treatments[diseaseIdx],
      admissionDate: d.toISOString().slice(0, 10),
      cost: r(200, 9500),
      visitCount: r(1, 12),
    });
  }
  return out;
}
