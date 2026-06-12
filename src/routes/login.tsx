import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Healthcare Warehouse" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const setRole = useStore((s) => s.setRole);
  const [email, setEmail] = useState("admin@mediwarehouse.dev");
  const [password, setPassword] = useState("demo");
  const [role, setRoleLocal] = useState<Role>("admin");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setRole(role);
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 bg-sidebar text-sidebar-foreground p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ background: "var(--gradient-primary)" }} />
        <div className="relative flex items-center gap-2">
          <div className="size-10 rounded-xl bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center"><Activity className="size-5" /></div>
          <div className="font-semibold tracking-tight">MediWarehouse</div>
        </div>
        <div className="relative space-y-4 max-w-md">
          <h2 className="text-4xl font-semibold leading-tight">Centralized patient analytics, built for healthcare teams.</h2>
          <p className="text-sidebar-foreground/70 text-sm">ETL, star-schema warehouse, OLAP queries and ML-powered disease prediction — all in one workspace.</p>
          <div className="flex items-center gap-2 text-xs text-sidebar-foreground/60"><ShieldCheck className="size-4" /> HIPAA-conscious design • role-based access</div>
        </div>
        <div className="relative text-xs text-sidebar-foreground/40">© {new Date().getFullYear()} MediWarehouse Analytics</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <form onSubmit={submit} className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to access the analytics workspace.</p>

          <div className="space-y-3 mt-6">
            <Field label="Email"><input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
            <Field label="Password"><input className={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
            <Field label="Sign in as">
              <select className={input} value={role} onChange={(e) => setRoleLocal(e.target.value as Role)}>
                <option value="admin">Admin</option>
                <option value="doctor">Doctor</option>
                <option value="analyst">Data Analyst</option>
              </select>
            </Field>
          </div>

          <button type="submit" className="mt-6 w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:opacity-90">
            Sign in
          </button>
          <p className="text-xs text-muted-foreground mt-4 text-center">Demo mode — any credentials work.</p>
        </form>
      </div>
    </div>
  );
}

const input = "w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<label className="block"><span className="text-xs text-muted-foreground">{label}</span><div className="mt-1">{children}</div></label>);
}
