import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Pie, Bar, Line } from "react-chartjs-2";
import { Users, HeartPulse, AlertTriangle, CalendarCheck } from "lucide-react";
import { AppShell, StatCard, Card } from "@/components/AppShell";
import { useStore } from "@/lib/store";
import { CHART_COLORS, CHART_DEFAULTS } from "@/lib/chart-setup";
import { MODEL_ACCURACY } from "@/lib/ml";
import "@/lib/chart-setup";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Healthcare Data Warehouse" },
      { name: "description", content: "Centralized patient analytics, ETL, warehouse and disease prediction." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const patients = useStore((s) => s.patients);

  const stats = useMemo(() => {
    const diseases = new Set(patients.map((p) => p.disease));
    const highRisk = patients.filter(
      (p) => ["Heart Disease", "Stroke", "Diabetes", "Hypertension"].includes(p.disease) && p.age > 55,
    ).length;
    const now = new Date();
    const monthly = patients.filter((p) => {
      const d = new Date(p.admissionDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    return { total: patients.length, diseases: diseases.size, highRisk, monthly };
  }, [patients]);

  const diseaseDist = useMemo(() => {
    const m = new Map<string, number>();
    patients.forEach((p) => m.set(p.disease, (m.get(p.disease) ?? 0) + 1));
    return { labels: [...m.keys()], data: [...m.values()] };
  }, [patients]);

  const ageGroups = useMemo(() => {
    const buckets = { "0-18": 0, "19-35": 0, "36-55": 0, "56-75": 0, "75+": 0 } as Record<string, number>;
    patients.forEach((p) => {
      const k = p.age <= 18 ? "0-18" : p.age <= 35 ? "19-35" : p.age <= 55 ? "36-55" : p.age <= 75 ? "56-75" : "75+";
      buckets[k]++;
    });
    return buckets;
  }, [patients]);

  const monthly = useMemo(() => {
    const labels: string[] = [];
    const data: number[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(d.toLocaleString("default", { month: "short" }));
      data.push(patients.filter((p) => {
        const pd = new Date(p.admissionDate);
        return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
      }).length);
    }
    return { labels, data };
  }, [patients]);

  const gender = useMemo(() => {
    const m = { Male: 0, Female: 0, Other: 0 } as Record<string, number>;
    patients.forEach((p) => m[p.gender]++);
    return m;
  }, [patients]);

  return (
    <AppShell title="Overview" subtitle="Real-time patient analytics across the healthcare warehouse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Patients" value={stats.total} icon={Users} tone="primary" delta="across all dimensions" />
        <StatCard label="Tracked Diseases" value={stats.diseases} icon={HeartPulse} tone="info" delta="dimension entries" />
        <StatCard label="High-Risk Patients" value={stats.highRisk} icon={AlertTriangle} tone="warning" delta="age > 55 + chronic" />
        <StatCard label="Visits this Month" value={stats.monthly} icon={CalendarCheck} tone="success" delta="admissions" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card title="Disease Distribution">
          <div className="h-72">
            <Pie
              data={{
                labels: diseaseDist.labels,
                datasets: [{
                  data: diseaseDist.data,
                  backgroundColor: CHART_COLORS,
                  borderWidth: 0,
                }],
              }}
              options={{ maintainAspectRatio: false, plugins: { legend: { position: "right", labels: { font: { size: 11 } } } } }}
            />
          </div>
        </Card>
        <Card title="Age Group Analysis">
          <div className="h-72">
            <Bar
              data={{
                labels: Object.keys(ageGroups),
                datasets: [{ label: "Patients", data: Object.values(ageGroups), backgroundColor: CHART_COLORS[0], borderRadius: 6 }],
              }}
              options={{ ...CHART_DEFAULTS, maintainAspectRatio: false, plugins: { legend: { display: false } } } as never}
            />
          </div>
        </Card>
        <Card title="Gender Analysis">
          <div className="h-72">
            <Pie
              data={{
                labels: Object.keys(gender),
                datasets: [{ data: Object.values(gender), backgroundColor: [CHART_COLORS[0], CHART_COLORS[3], CHART_COLORS[2]], borderWidth: 0 }],
              }}
              options={{ maintainAspectRatio: false }}
            />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Monthly Patient Visits">
          <div className="h-72">
            <Line
              data={{
                labels: monthly.labels,
                datasets: [{
                  label: "Visits",
                  data: monthly.data,
                  borderColor: CHART_COLORS[0],
                  backgroundColor: "rgba(15,154,154,0.15)",
                  fill: true,
                  tension: 0.35,
                  pointRadius: 3,
                }],
              }}
              options={{ ...CHART_DEFAULTS, maintainAspectRatio: false } as never}
            />
          </div>
        </Card>
        <Card title="Model Prediction Accuracy">
          <div className="h-72">
            <Bar
              data={{
                labels: ["Diabetes", "Heart", "Stroke"],
                datasets: (["Logistic Regression", "Decision Tree", "Random Forest"] as const).map((algo, i) => ({
                  label: algo,
                  data: [MODEL_ACCURACY[algo].diabetes, MODEL_ACCURACY[algo].heart, MODEL_ACCURACY[algo].stroke],
                  backgroundColor: CHART_COLORS[i],
                  borderRadius: 6,
                })),
              }}
              options={{ ...CHART_DEFAULTS, maintainAspectRatio: false, scales: { ...CHART_DEFAULTS.scales, y: { ...CHART_DEFAULTS.scales.y, min: 0.6, max: 1 } } } as never}
            />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
