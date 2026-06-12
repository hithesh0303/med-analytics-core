import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, X } from "lucide-react";
import { AppShell, Card } from "@/components/AppShell";
import { useStore } from "@/lib/store";
import type { Gender, Patient } from "@/lib/types";

export const Route = createFileRoute("/patients")({
  head: () => ({ meta: [{ title: "Patients — Healthcare Warehouse" }] }),
  component: PatientsPage,
});

const empty = (): Patient => ({
  id: `P${Math.floor(Math.random() * 9000) + 1000}`,
  name: "", age: 30, gender: "Male", bloodGroup: "O+",
  contact: "", disease: "", treatment: "",
  admissionDate: new Date().toISOString().slice(0, 10),
  cost: 0, visitCount: 1,
});

function PatientsPage() {
  const { patients, addPatient, updatePatient, deletePatient } = useStore();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Patient | null>(null);
  const [creating, setCreating] = useState(false);
  const [historyFor, setHistoryFor] = useState<Patient | null>(null);

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return patients.filter((p) =>
      !s || p.name.toLowerCase().includes(s) || p.id.toLowerCase().includes(s) || p.disease.toLowerCase().includes(s),
    );
  }, [patients, q]);

  return (
    <AppShell title="Patient Records" subtitle="Manage admissions, demographics and medical history">
      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, ID, or disease…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
          >
            <Plus className="size-4" /> Add patient
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="py-3 pr-4">ID</th><th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Age</th><th className="py-3 pr-4">Gender</th>
                <th className="py-3 pr-4">Blood</th><th className="py-3 pr-4">Disease</th>
                <th className="py-3 pr-4">Treatment</th><th className="py-3 pr-4">Admitted</th>
                <th className="py-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map((p) => (
                <tr key={p.id} className="border-b border-border/60 hover:bg-muted/40">
                  <td className="py-3 pr-4 font-mono text-xs">{p.id}</td>
                  <td className="py-3 pr-4 font-medium">{p.name}</td>
                  <td className="py-3 pr-4">{p.age}</td>
                  <td className="py-3 pr-4">{p.gender}</td>
                  <td className="py-3 pr-4">{p.bloodGroup}</td>
                  <td className="py-3 pr-4">{p.disease}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{p.treatment}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{p.admissionDate}</td>
                  <td className="py-3 pr-4">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setHistoryFor(p)} className="px-2 py-1 text-xs rounded hover:bg-accent">History</button>
                      <button onClick={() => setEditing(p)} className="p-1.5 rounded hover:bg-accent"><Pencil className="size-4" /></button>
                      <button onClick={() => deletePatient(p.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="size-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="py-12 text-center text-muted-foreground">No patients found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 200 && <div className="text-xs text-muted-foreground mt-3">Showing first 200 of {filtered.length} matches.</div>}
      </Card>

      {(creating || editing) && (
        <PatientDialog
          initial={editing ?? empty()}
          mode={editing ? "edit" : "create"}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSubmit={(p) => {
            if (editing) updatePatient(editing.id, p);
            else addPatient(p);
            setCreating(false); setEditing(null);
          }}
        />
      )}

      {historyFor && <HistoryDialog patient={historyFor} onClose={() => setHistoryFor(null)} />}
    </AppShell>
  );
}

function PatientDialog({ initial, mode, onClose, onSubmit }: {
  initial: Patient; mode: "create" | "edit";
  onClose: () => void; onSubmit: (p: Patient) => void;
}) {
  const [p, setP] = useState<Patient>(initial);
  const set = <K extends keyof Patient>(k: K, v: Patient[K]) => setP((s) => ({ ...s, [k]: v }));
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-elevated)] w-full max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{mode === "create" ? "Add patient" : `Edit ${initial.name}`}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent"><X className="size-4" /></button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(p); }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <Field label="Patient ID"><input className={input} value={p.id} onChange={(e) => set("id", e.target.value)} required /></Field>
          <Field label="Name"><input className={input} value={p.name} onChange={(e) => set("name", e.target.value)} required /></Field>
          <Field label="Age"><input type="number" className={input} value={p.age} onChange={(e) => set("age", +e.target.value)} required /></Field>
          <Field label="Gender">
            <select className={input} value={p.gender} onChange={(e) => set("gender", e.target.value as Gender)}>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </Field>
          <Field label="Blood Group"><input className={input} value={p.bloodGroup} onChange={(e) => set("bloodGroup", e.target.value)} /></Field>
          <Field label="Contact"><input className={input} value={p.contact} onChange={(e) => set("contact", e.target.value)} /></Field>
          <Field label="Disease"><input className={input} value={p.disease} onChange={(e) => set("disease", e.target.value)} /></Field>
          <Field label="Treatment"><input className={input} value={p.treatment} onChange={(e) => set("treatment", e.target.value)} /></Field>
          <Field label="Admission Date"><input type="date" className={input} value={p.admissionDate} onChange={(e) => set("admissionDate", e.target.value)} /></Field>
          <Field label="Cost (USD)"><input type="number" className={input} value={p.cost ?? 0} onChange={(e) => set("cost", +e.target.value)} /></Field>

          <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-accent">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:opacity-90">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function HistoryDialog({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const visits = Array.from({ length: patient.visitCount ?? 1 }).map((_, i) => {
    const d = new Date(patient.admissionDate);
    d.setDate(d.getDate() - i * 35);
    return { date: d.toISOString().slice(0, 10), note: i === 0 ? "Initial admission" : `Follow-up visit #${i}` };
  });
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">{patient.name}</h3>
            <p className="text-sm text-muted-foreground">{patient.disease} • {patient.treatment}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent"><X className="size-4" /></button>
        </div>
        <ol className="relative border-l border-border ml-2 space-y-4">
          {visits.map((v, i) => (
            <li key={i} className="ml-4">
              <div className="absolute -left-1.5 size-3 rounded-full bg-primary" />
              <div className="text-xs text-muted-foreground">{v.date}</div>
              <div className="text-sm font-medium">{v.note}</div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

const input = "w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
