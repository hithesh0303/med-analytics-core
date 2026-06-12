import { createFileRoute } from "@tanstack/react-router";
import { FileDown, FileSpreadsheet, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { AppShell, Card } from "@/components/AppShell";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — Export & Summary" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const patients = useStore((s) => s.patients);

  function exportPDF() {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Healthcare Patient Summary Report", 14, 18);
    doc.setFontSize(10);
    doc.text(`Generated ${new Date().toLocaleString()} • ${patients.length} patients`, 14, 26);
    autoTable(doc, {
      startY: 32,
      head: [["ID", "Name", "Age", "Gender", "Disease", "Treatment", "Admitted", "Cost"]],
      body: patients.map((p) => [p.id, p.name, p.age, p.gender, p.disease, p.treatment, p.admissionDate, `$${p.cost ?? 0}`]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 154, 154] },
    });
    doc.save("patient-summary.pdf");
  }

  function exportXLSX() {
    const ws = XLSX.utils.json_to_sheet(patients);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Patients");
    XLSX.writeFile(wb, "patient-records.xlsx");
  }

  // Summary aggregates
  const byDisease = patients.reduce<Record<string, number>>((m, p) => ((m[p.disease] = (m[p.disease] ?? 0) + 1), m), {});
  const totalCost = patients.reduce((s, p) => s + (p.cost ?? 0), 0);

  return (
    <AppShell title="Reports & Exports" subtitle="Generate PDF / Excel reports from the warehouse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card>
          <div className="flex items-center gap-3 mb-3"><FileText className="size-5 text-destructive" /><div className="font-semibold">PDF Report</div></div>
          <p className="text-xs text-muted-foreground mb-4">Patient summary table with disease, treatment and cost.</p>
          <button onClick={exportPDF} className="w-full inline-flex justify-center items-center gap-2 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90"><FileDown className="size-4" /> Download PDF</button>
        </Card>
        <Card>
          <div className="flex items-center gap-3 mb-3"><FileSpreadsheet className="size-5 text-success" /><div className="font-semibold">Excel Export</div></div>
          <p className="text-xs text-muted-foreground mb-4">All patient rows as XLSX for downstream analysis.</p>
          <button onClick={exportXLSX} className="w-full inline-flex justify-center items-center gap-2 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90"><FileDown className="size-4" /> Download Excel</button>
        </Card>
        <Card>
          <div className="flex items-center gap-3 mb-3"><FileText className="size-5 text-info" /><div className="font-semibold">Summary</div></div>
          <ul className="text-sm space-y-1">
            <li>Total patients: <b>{patients.length}</b></li>
            <li>Total billed cost: <b>${totalCost.toLocaleString()}</b></li>
            <li>Distinct diseases: <b>{Object.keys(byDisease).length}</b></li>
          </ul>
        </Card>
      </div>

      <Card title="Patient Summary by Disease">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="py-2 pr-4">Disease</th><th className="py-2 pr-4">Patient count</th><th className="py-2 pr-4">% of total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(byDisease).sort((a, b) => b[1] - a[1]).map(([d, n]) => (
                <tr key={d} className="border-b border-border/60">
                  <td className="py-2 pr-4 font-medium">{d}</td>
                  <td className="py-2 pr-4">{n}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{((n / patients.length) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
