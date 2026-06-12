import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Database,
  Warehouse,
  Brain,
  FileText,
  Activity,
  LogOut,
} from "lucide-react";
import type { ReactNode } from "react";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "doctor", "analyst"] as Role[] },
  { to: "/patients", label: "Patients", icon: Users, roles: ["admin", "doctor"] as Role[] },
  { to: "/etl", label: "Data Integration", icon: Database, roles: ["admin", "analyst"] as Role[] },
  { to: "/warehouse", label: "Warehouse / OLAP", icon: Warehouse, roles: ["admin", "analyst"] as Role[] },
  { to: "/predictions", label: "Predictions", icon: Brain, roles: ["admin", "doctor", "analyst"] as Role[] },
  { to: "/reports", label: "Reports", icon: FileText, roles: ["admin", "analyst"] as Role[] },
];

export function AppShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { role, setRole } = useStore();
  const visible = NAV.filter((n) => n.roles.includes(role));

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground">
        <div className="px-6 py-5 border-b border-sidebar-border flex items-center gap-2">
          <div className="size-9 rounded-xl bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center">
            <Activity className="size-5" />
          </div>
          <div>
            <div className="font-semibold tracking-tight">MediWarehouse</div>
            <div className="text-[11px] text-sidebar-foreground/60 uppercase tracking-wider">Analytics Platform</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {visible.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <label className="text-[11px] uppercase tracking-wider text-sidebar-foreground/60 px-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="mt-1 w-full bg-sidebar-accent text-sidebar-accent-foreground rounded-md px-3 py-2 text-sm border border-sidebar-border focus:outline-none focus:ring-2 focus:ring-sidebar-ring"
          >
            <option value="admin">Admin</option>
            <option value="doctor">Doctor</option>
            <option value="analyst">Data Analyst</option>
          </select>
          <Link
            to="/login"
            className="mt-3 flex items-center gap-2 px-3 py-2 rounded-md text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent"
          >
            <LogOut className="size-4" /> Sign out
          </Link>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="bg-card border-b border-border px-6 md:px-10 py-5">
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </header>
        <div className="p-6 md:p-10">{children}</div>
      </main>
    </div>
  );
}

export function StatCard({
  label, value, delta, icon: Icon, tone = "primary",
}: {
  label: string; value: string | number; delta?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "primary" | "success" | "warning" | "info";
}) {
  const toneBg = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
    info: "bg-info/15 text-info",
  }[tone];
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="text-3xl font-semibold mt-2 text-foreground">{value}</div>
          {delta && <div className="text-xs text-muted-foreground mt-1">{delta}</div>}
        </div>
        <div className={cn("size-10 rounded-xl flex items-center justify-center", toneBg)}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}

export function Card({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-card)]">
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
