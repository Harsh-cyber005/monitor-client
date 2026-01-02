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
      ? (runningVms.reduce((acc, v) => {
        const usage = v.diskTotalMB > 0 ? (v.diskUsedMB / v.diskTotalMB) * 100 : 0;
        return acc + usage;
      }, 0) / runningCount)
      : 0;

    return {
      totalVMs: vms.length,
      runningCount,
      avgCpu,
      avgDiskUsage,
      isDiskCritical: avgDiskUsage > 90,
      isDiskWarning: avgDiskUsage > 75,
      hasDiskData: runningCount > 0 && runningVms.some(v => v.diskTotalMB > 0)
    };
  }, [vms]);

  return (
    <div className="p-6 lg:p-10 space-y-10 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-50">Infrastructure Overview</h1>
          <p className="text-slate-400 mt-1">Real-time telemetry from active instances.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={refreshing}
            onClick={() => {
              setRefreshing(true);
              refreshVMs();
              setTimeout(() => setRefreshing(false), 2000);
            }}
            className="border-slate-800 bg-slate-900 text-slate-400 hover:text-white cursor-pointer h-9 px-3"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? "Refreshing..." : "Force Refresh"}
          </Button>
          <CreateVMDialog />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Instances */}
        <Card className="bg-slate-900/50 border-slate-800 shadow-2xl backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 font-mono tracking-widest uppercase">Total Instances</CardTitle>
            <Server className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-50">{loading ? "..." : stats.totalVMs}</div>
          </CardContent>
        </Card>

        {/* Nodes Online */}
        <Card className="bg-slate-900/50 border-slate-800 shadow-2xl backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 font-mono tracking-widest uppercase">Nodes Online</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500">
              {loading ? "..." : stats.runningCount}
            </div>
          </CardContent>
        </Card>

        {/* Avg CPU */}
        <Card className="bg-slate-900/50 border-slate-800 shadow-2xl backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 font-mono tracking-widest uppercase">Avg CPU Load</CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-50">{loading ? "..." : `${stats.avgCpu}%`}</div>
          </CardContent>
        </Card>

        {/* Disk Status */}
        <Card className="bg-slate-900/50 border-slate-800 shadow-2xl backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 font-mono tracking-widest uppercase">Disk Status</CardTitle>
            <HardDrive className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className={`text-xs font-bold px-2.5 py-1 rounded w-fit tracking-wider ${stats.isDiskCritical ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
              stats.isDiskWarning ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                'bg-sky-500/10 text-sky-400 border border-sky-500/20'
              }`}>
              {loading ? "..." : stats.isDiskCritical ? "CRITICAL" : stats.isDiskWarning ? "WARNING" : "OPTIMAL"}
            </div>
            {!loading && stats.hasDiskData && (
              <p className="text-[10px] text-slate-500 font-mono uppercase">
                Avg Usage: {stats.avgDiskUsage.toFixed(1)}%
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Table Section */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-200">Connected Instances</h2>
          <span className="text-[10px] text-slate-500 font-mono bg-slate-900 border border-slate-800 px-2 py-1 rounded">
            {vms.length} NODES DETECTED
          </span>
        </div>

        {/* Scrollbar Fix: The wrapper below handles the overflow clean-up */}
        <div className="overflow-x-auto no-scrollbar pb-4">
          <VMTable />
        </div>
      </div>
    </div>
  );
}