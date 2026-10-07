import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { NetWorthPanel } from "@/components/dashboard/net-worth-panel";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background">
      <DashboardHeader />
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rail:flex-row">
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 md:px-6">
          {children}
        </main>
        <NetWorthPanel />
      </div>
    </div>
  );
}
