import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Brain, Activity } from "lucide-react";
import { AppShell, Card } from "@/components/AppShell";
import { useStore } from "@/lib/store";
import { predict, MODEL_ACCURACY } from "@/lib/ml";
import type { DiseaseModel, Gender, PredictionInput, PredictionResult } from "@/lib/types";

export const Route = createFileRoute("/predictions")({
  head: () => ({ meta: [{ title: "Disease Prediction — ML Analytics" }] }),
  component: PredictionsPage,
});

function PredictionsPage() {
  const { predictions, addPrediction } = useStore();
  const [model, setModel] = useState<DiseaseModel>("diabetes");
  const [algorithm, setAlgorithm] = useState<PredictionResult["algorithm"]>("Random Forest");
  const [x, setX] = useState<PredictionInput>({
    age: 45, gender: "Male", bmi: 27.5, bloodPressure: 130, glucose: 110, smoking: false,
  });
  const [result, setResult] = useState<PredictionResult | null>(null);

  function run(e: React.FormEvent) {
    e.preventDefault();
    const r = predict(model, algorithm, x);
    setResult(r);
    addPrediction(r);
  }

  const acc = MODEL_ACCURACY[algorithm][model];

  return (
    <AppShell title="Patient Analytics & Disease Prediction" subtitle="Logistic Regression / Decision Tree / Random Forest classifiers">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <Card title="Prediction Input">
            <form onSubmit={run} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Disease Model">
                <select className={input} value={model} onChange={(e) => setModel(e.target.value as DiseaseModel)}>
                  <option value="diabetes">Diabetes</option>
                  <option value="heart">Heart Disease</option>
                  <option value="stroke">Stroke Risk</option>
                </select>
              </Field>
              <Field label="Algorithm">
                <select className={input} value={algorithm} onChange={(e) => setAlgorithm(e.target.value as PredictionResult["algorithm"])}>
                  <option>Random Forest</option>
                  <option>Decision Tree</option>
                  <option>Logistic Regression</option>
                </select>
              </Field>
              <Field label="Age"><input className={input} type="number" value={x.age} onChange={(e) => setX({ ...x, age: +e.target.value })} /></Field>
              <Field label="Gender">
                <select className={input} value={x.gender} onChange={(e) => setX({ ...x, gender: e.target.value as Gender })}>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </Field>
              <Field label="BMI"><input className={input} type="number" step="0.1" value={x.bmi} onChange={(e) => setX({ ...x, bmi: +e.target.value })} /></Field>
              <Field label="Blood Pressure (mmHg)"><input className={input} type="number" value={x.bloodPressure} onChange={(e) => setX({ ...x, bloodPressure: +e.target.value })} /></Field>
              <Field label="Glucose Level (mg/dL)"><input className={input} type="number" value={x.glucose} onChange={(e) => setX({ ...x, glucose: +e.target.value })} /></Field>
              <Field label="Smoker">
                <select className={input} value={x.smoking ? "yes" : "no"} onChange={(e) => setX({ ...x, smoking: e.target.value === "yes" })}>
                  <option value="no">No</option><option value="yes">Yes</option>
                </select>
              </Field>
              <div className="sm:col-span-2">
                <button className="w-full inline-flex justify-center items-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:opacity-90">
                  <Brain className="size-4" /> Run prediction
                </button>
              </div>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card title="Result">
            {result ? <ResultDisplay r={result} accuracy={acc} /> : (
              <div className="py-10 text-center text-sm text-muted-foreground">
                <Activity className="size-10 mx-auto mb-2 text-primary/40" />
                Submit the form to see a risk prediction
              </div>
            )}
          </Card>
          <Card title="Model Reference">
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Reported test accuracy for <b className="text-foreground">{algorithm}</b> on <b className="text-foreground">{label(model)}</b>: <span className="text-primary font-semibold">{(acc * 100).toFixed(1)}%</span></div>
              <div>Trained on merged Diabetes / Heart / Stroke datasets following standard preprocessing.</div>
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-4">
        <Card title="Recent Predictions">
          {predictions.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No predictions yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="py-2 pr-4">When</th><th className="py-2 pr-4">Disease</th><th className="py-2 pr-4">Algorithm</th>
                  <th className="py-2 pr-4">Risk</th><th className="py-2 pr-4">Category</th>
                </tr></thead>
                <tbody>
                  {predictions.slice(0, 25).map((p) => (
                    <tr key={p.timestamp} className="border-b border-border/60">
                      <td className="py-2 pr-4 text-muted-foreground">{new Date(p.timestamp).toLocaleString()}</td>
                      <td className="py-2 pr-4">{label(p.model)}</td>
                      <td className="py-2 pr-4">{p.algorithm}</td>
                      <td className="py-2 pr-4 font-semibold">{(p.risk * 100).toFixed(1)}%</td>
                      <td className="py-2 pr-4"><RiskPill cat={p.category} /></td>
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

function ResultDisplay({ r, accuracy }: { r: PredictionResult; accuracy: number }) {
  const pct = (r.risk * 100).toFixed(1);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label(r.model)} risk</div>
          <div className="text-4xl font-bold mt-1">{pct}%</div>
        </div>
        <RiskPill cat={r.category} large />
      </div>
      <div className="mt-4 h-3 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: r.category === "High" ? "var(--destructive)" : r.category === "Moderate" ? "var(--warning)" : "var(--success)",
          }}
        />
      </div>
      <div className="text-xs text-muted-foreground mt-3">
        Algorithm: <b className="text-foreground">{r.algorithm}</b> • test accuracy {(accuracy * 100).toFixed(1)}%
      </div>
    </div>
  );
}

function RiskPill({ cat, large = false }: { cat: PredictionResult["category"]; large?: boolean }) {
  const cls = cat === "High" ? "bg-destructive/15 text-destructive"
    : cat === "Moderate" ? "bg-warning/25 text-warning-foreground"
    : "bg-success/15 text-success";
  return <span className={`inline-flex rounded-full font-semibold ${large ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs"} ${cls}`}>{cat}</span>;
}

const input = "w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<label className="block"><span className="text-xs text-muted-foreground">{label}</span><div className="mt-1">{children}</div></label>);
}
function label(m: DiseaseModel) { return m === "diabetes" ? "Diabetes" : m === "heart" ? "Heart Disease" : "Stroke"; }
