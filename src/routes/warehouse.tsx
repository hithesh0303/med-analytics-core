import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, Card } from "@/components/AppShell";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/warehouse")({
  head: () => ({ meta: [{ title: "Warehouse — Star Schema & OLAP" }] }),
  component: WarehousePage,
});

const SCHEMA = `-- Star Schema for Healthcare Data Warehouse

CREATE TABLE Dim_Patient (
  PatientID    VARCHAR(16) PRIMARY KEY,
  Name         VARCHAR(120),
  Age          INT,
  Gender       VARCHAR(10),
  BloodGroup   VARCHAR(4)
);

CREATE TABLE Dim_Disease (
  DiseaseID    INT PRIMARY KEY,
  DiseaseName  VARCHAR(80)
);

CREATE TABLE Dim_Date (
  DateID       INT PRIMARY KEY,
  Day          INT,
  Month        INT,
  Year         INT
);

CREATE TABLE Fact_HealthRecords (
  RecordID     BIGINT PRIMARY KEY AUTO_INCREMENT,
  PatientID    VARCHAR(16) REFERENCES Dim_Patient(PatientID),
  DiseaseID    INT         REFERENCES Dim_Disease(DiseaseID),
  DateID       INT         REFERENCES Dim_Date(DateID),
  Cost         DECIMAL(10,2),
  VisitCount   INT
);
`;

const QUERIES = [
  { name: "Total revenue per disease", sql: `SELECT d.DiseaseName, SUM(f.Cost) AS revenue
FROM Fact_HealthRecords f
JOIN Dim_Disease d ON d.DiseaseID = f.DiseaseID
GROUP BY d.DiseaseName
ORDER BY revenue DESC;` },
  { name: "Monthly visit counts (roll-up)", sql: `SELECT dt.Year, dt.Month, SUM(f.VisitCount) AS visits
FROM Fact_HealthRecords f
JOIN Dim_Date dt ON dt.DateID = f.DateID
GROUP BY dt.Year, dt.Month
ORDER BY dt.Year, dt.Month;` },
  { name: "Slice: high-cost patients > $5000", sql: `SELECT p.Name, p.Age, d.DiseaseName, f.Cost
FROM Fact_HealthRecords f
JOIN Dim_Patient p ON p.PatientID = f.PatientID
JOIN Dim_Disease d ON d.DiseaseID = f.DiseaseID
WHERE f.Cost > 5000
ORDER BY f.Cost DESC;` },
  { name: "Drill-down: disease × age bucket", sql: `SELECT d.DiseaseName,
       CASE WHEN p.Age <= 35 THEN '0-35'
            WHEN p.Age <= 55 THEN '36-55'
            ELSE '55+' END AS age_bucket,
       COUNT(*) AS patients
FROM Fact_HealthRecords f
JOIN Dim_Patient p ON p.PatientID = f.PatientID
JOIN Dim_Disease d ON d.DiseaseID = f.DiseaseID
GROUP BY d.DiseaseName, age_bucket;` },
];

function WarehousePage() {
  const patients = useStore((s) => s.patients);
  const [selected, setSelected] = useState(0);

  // Live OLAP-style results computed from in-memory warehouse
  const results = useMemo(() => {
    switch (selected) {
      case 0: {
        const m = new Map<string, number>();
        patients.forEach((p) => m.set(p.disease, (m.get(p.disease) ?? 0) + (p.cost ?? 0)));
        return { cols: ["DiseaseName", "Revenue"], rows: [...m].sort((a, b) => b[1] - a[1]).map(([d, r]) => [d, `$${r.toLocaleString()}`]) };
      }
      case 1: {
        const m = new Map<string, number>();
        patients.forEach((p) => {
          const d = new Date(p.admissionDate);
          const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          m.set(k, (m.get(k) ?? 0) + (p.visitCount ?? 1));
        });
        return { cols: ["Year-Month", "Visits"], rows: [...m].sort().map(([k, v]) => [k, String(v)]) };
      }
      case 2: {
        return {
          cols: ["Name", "Age", "Disease", "Cost"],
          rows: patients.filter((p) => (p.cost ?? 0) > 5000)
            .sort((a, b) => (b.cost ?? 0) - (a.cost ?? 0))
            .map((p) => [p.name, String(p.age), p.disease, `$${(p.cost ?? 0).toLocaleString()}`]),
        };
      }
      case 3: {
        const m = new Map<string, number>();
        patients.forEach((p) => {
          const ab = p.age <= 35 ? "0-35" : p.age <= 55 ? "36-55" : "55+";
          const k = `${p.disease}||${ab}`;
          m.set(k, (m.get(k) ?? 0) + 1);
        });
        return { cols: ["Disease", "Age Bucket", "Patients"], rows: [...m].map(([k, v]) => { const [d, a] = k.split("||"); return [d, a, String(v)]; }) };
      }
      default: return { cols: [], rows: [] };
    }
  }, [selected, patients]);

  return (
    <AppShell title="Data Warehouse" subtitle="Star schema, SQL queries and OLAP analysis">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card title="Fact Table">
          <div className="text-sm">
            <div className="font-semibold text-primary">Fact_HealthRecords</div>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>• PatientID (FK)</li><li>• DiseaseID (FK)</li><li>• DateID (FK)</li>
              <li>• Cost</li><li>• VisitCount</li>
            </ul>
            <div className="text-xs mt-3 text-muted-foreground">{patients.length} fact rows</div>
          </div>
        </Card>
        <Card title="Dimension: Patient">
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• PatientID (PK)</li><li>• Name</li><li>• Age</li><li>• Gender</li><li>• BloodGroup</li>
          </ul>
        </Card>
        <Card title="Dimension: Disease / Date">
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• DiseaseID, DiseaseName</li>
            <li>• DateID, Day, Month, Year</li>
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Schema DDL">
          <pre className="text-[11px] bg-muted/50 rounded-lg p-3 overflow-auto max-h-96 font-mono leading-relaxed">{SCHEMA}</pre>
        </Card>

        <Card title="OLAP Query Explorer">
          <div className="flex flex-wrap gap-2 mb-3">
            {QUERIES.map((q, i) => (
              <button
                key={q.name}
                onClick={() => setSelected(i)}
                className={`px-3 py-1.5 rounded-lg text-xs border transition ${
                  selected === i
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-accent"
                }`}
              >
                {q.name}
              </button>
            ))}
          </div>
          <pre className="text-[11px] bg-muted/50 rounded-lg p-3 overflow-auto font-mono leading-relaxed mb-3">{QUERIES[selected].sql}</pre>
          <div className="overflow-auto max-h-72 border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>{results.cols.map((c) => <th key={c} className="py-2 px-3 text-left text-xs uppercase tracking-wider text-muted-foreground">{c}</th>)}</tr>
              </thead>
              <tbody>
                {results.rows.slice(0, 50).map((row, i) => (
                  <tr key={i} className="border-t border-border/60">
                    {row.map((c, j) => <td key={j} className="py-2 px-3">{c}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
