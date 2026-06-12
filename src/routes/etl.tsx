import { createFileRoute } from "@tanstack/react-router";
import Papa from "papaparse";
import { useRef, useState } from "react";
import { Upload, CheckCircle2, AlertCircle, Database } from "lucide-react";
import { AppShell, Card, StatCard } from "@/components/AppShell";
import { useStore } from "@/lib/store";
import type { Patient } from "@/lib/types";

export const Route = createFileRoute("/etl")({
  head: () => ({ meta: [{ title: "ETL — Data Integration" }] }),
  component: EtlPage,
});

function EtlPage() {
  const { etlRuns, addEtlRun, bulkAdd } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<{ processed: number; loaded: number; duplicates: number; missing: number } | null>(null);

  function handleFile(file: File) {
    setBusy(true);
    Papa.parse<Record<string, string>>(file, {
      header: true, skipEmptyLines: true,
      complete: (res) => {
        const rows = res.data;
        const seen = new Set<string>();
        let duplicates = 0, missing = 0;
        const cleaned: Patient[] = [];
        rows.forEach((row, i) => {
          const id = (row.PatientID || row.id || row.ID || `IMP-${Date.now()}-${i}`).trim();
          if (seen.has(id)) { duplicates++; return; }
          seen.add(id);
          const get = (k: string, fallback = "") => (row[k] ?? row[k.toLowerCase()] ?? fallback).toString().trim();
          let filled = false;
          const name = get("Name") || (filled = true, "Unknown");
          const ageRaw = get("Age");
          if (!ageRaw) filled = true;
          if (filled) missing++;
          cleaned.push({
            id,
            name,
            age: +(ageRaw || 30),
            gender: ((get("Gender") || "Other") as Patient["gender"]),
            bloodGroup: get("BloodGroup") || get("Blood") || "O+",
            contact: get("Contact") || "—",
            disease: get("Disease") || get("Outcome") || "Unspecified",
            treatment: get("Treatment") || "Pending",
            admissionDate: get("AdmissionDate") || new Date().toISOString().slice(0, 10),
            cost: +(get("Cost") || 0),
            visitCount: +(get("VisitCount") || 1),
          });
        });

        bulkAdd(cleaned);
        const run = {
          id: `ETL-${Date.now()}`,
          filename: file.name,
          processed: rows.length,
          loaded: cleaned.length,
          duplicates,
          missingFilled: missing,
          status: "success" as const,
          timestamp: new Date().toISOString(),
        };
        addEtlRun(run);
        setLast({ processed: run.processed, loaded: run.loaded, duplicates, missing });
        setBusy(false);
      },
      error: () => {
        addEtlRun({
          id: `ETL-${Date.now()}`, filename: file.name, processed: 0, loaded: 0,
          duplicates: 0, missingFilled: 0, status: "error", timestamp: new Date().toISOString(),
        });
        setBusy(false);
      },
    });
  }

  return (
    <AppShell title="Data Integration & ETL" subtitle="Extract → Transform → Load CSV datasets into the warehouse">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card title="Upload Dataset">
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-accent/40 transition"
          >
            <Upload className="size-8 mx-auto text-primary mb-2" />
            <p className="text-sm font-medium">{busy ? "Processing…" : "Drop CSV here or click to upload"}</p>
            <p className="text-xs text-muted-foreground mt-1">Diabetes, Heart, Stroke or merged records</p>
            <input
              ref={fileRef} type="file" accept=".csv" hidden
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        </Card>

        <StatCard label="Records Processed" value={last?.processed ?? "—"} icon={Database} tone="info" delta="last run" />
        <StatCard label="Records Loaded" value={last?.loaded ?? "—"} icon={CheckCircle2} tone="success" delta={last ? `${last.duplicates} duplicates removed` : "no runs yet"} />
      </div>

      <Card title="ETL Pipeline Stages">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[
            { t: "Extract", d: "Parse CSV headers & rows" },
            { t: "Clean", d: `Fill missing values${last ? ` (${last.missing})` : ""}` },
            { t: "Transform", d: `Dedupe by PatientID${last ? ` (${last.duplicates})` : ""}` },
            { t: "Load", d: "Insert into warehouse" },
          ].map((s, i) => (
            <div key={s.t} className="p-4 rounded-xl bg-gradient-to-br from-accent/40 to-transparent border border-border">
              <div className="text-xs text-primary font-semibold">STAGE {i + 1}</div>
              <div className="font-semibold mt-1">{s.t}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.d}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-4">
        <Card title="Recent ETL Runs">
          {etlRuns.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No ETL runs yet. Upload a CSV to begin.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="py-2 pr-4">When</th><th className="py-2 pr-4">File</th>
                    <th className="py-2 pr-4">Processed</th><th className="py-2 pr-4">Loaded</th>
                    <th className="py-2 pr-4">Duplicates</th><th className="py-2 pr-4">Cleaned</th>
                    <th className="py-2 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {etlRuns.map((r) => (
                    <tr key={r.id} className="border-b border-border/60">
                      <td className="py-2 pr-4 text-muted-foreground">{new Date(r.timestamp).toLocaleString()}</td>
                      <td className="py-2 pr-4 font-medium">{r.filename}</td>
                      <td className="py-2 pr-4">{r.processed}</td>
                      <td className="py-2 pr-4">{r.loaded}</td>
                      <td className="py-2 pr-4">{r.duplicates}</td>
                      <td className="py-2 pr-4">{r.missingFilled}</td>
                      <td className="py-2 pr-4">
                        {r.status === "success" ? (
                          <span className="inline-flex items-center gap-1 text-success text-xs"><CheckCircle2 className="size-3.5" /> Success</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-destructive text-xs"><AlertCircle className="size-3.5" /> Failed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
