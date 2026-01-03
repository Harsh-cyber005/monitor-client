"use client";

import { useMemo, useState } from "react";
import { useVMs } from "@/context/VMContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Server, Zap, HardDrive, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VMTable } from "@/components/VMTable";
import { CreateVMDialog } from "@/components/CreateVMDialog";

export default function DashboardPage() {
  const { vms, loading, refreshVMs } = useVMs();
  const [refreshing, setRefreshing] = useState(false);

  const stats = useMemo(() => {
    const runningVms = vms.filter((v) => v.status === "running");
    const runningCount = runningVms.length;
    const avgCpu = runningCount > 0
      ? (runningVms.reduce((acc, v) => acc + v.cpuUsedPct, 0) / runningCount).toFixed(1)
      : "0";
    const avgDiskUsage = runningCount > 0
      ? (runningVms.reduce((acc, v) => (v.diskTotalMB > 0 ? (v.diskUsedMB / v.diskTotalMB) * 100 : 0) + acc, 0) / runningCount)
      : 0;

    return { totalVMs: vms.length, runningCount, avgCpu, avgDiskUsage };
  }, [vms]);

  const statsConfig = [
    { label: "Total Instances", value: stats.totalVMs, icon: Server, color: "text-white" },
    { label: "Nodes Online", value: stats.runningCount, icon: Activity, color: "text-emerald-500" },
    { label: "Avg CPU Load", value: `${stats.avgCpu}%`, icon: Zap, color: "text-white" },
    {
      label: "Disk Status",
      value: stats.avgDiskUsage > 90 ? "Critical" : "Optimal",
      icon: HardDrive,
      color: stats.avgDiskUsage > 90 ? "text-red-500" : "text-emerald-500"
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <div className="p-4 md:p-10 space-y-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-neutral-800 pb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tighter">Infrastructure</h1>
            <p className="text-neutral-500 text-sm mt-1 font-medium">Real-time telemetry from active instances.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={refreshing}
              onClick={() => {
                setRefreshing(true);
                refreshVMs();
                setTimeout(() => setRefreshing(false), 2000);
              }}
              className="bg-black border-neutral-800 hover:bg-neutral-900 text-neutral-400 h-9 px-3 rounded-none transition-all cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline text-xs uppercase tracking-widest font-bold">Sync Data</span>
            </Button>
            <CreateVMDialog />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {statsConfig.map((stat, i) => (
            <Card key={i} className="bg-black border-neutral-800 rounded-none shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">{stat.label}</CardTitle>
                <stat.icon className="h-3 w-3 text-neutral-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold tracking-tight ${stat.color}`}>
                  {loading ? <span className="animate-pulse opacity-50">...</span> : stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-neutral-500">
            <div className="h-1 w-1 rounded-full bg-neutral-500" />
            <h2 className="text-[10px] font-bold font-mono uppercase tracking-[0.3em]">Active Instances</h2>
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <VMTable />
          </div>
        </div>
      </div>
    </div>
  );
}