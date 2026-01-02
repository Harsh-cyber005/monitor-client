"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Cpu, Database, Globe, Activity, HardDrive, RefreshCw, Loader2 } from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from "recharts";

export default function VMDetailPage() {
    const { vmId } = useParams();
    const router = useRouter();
    const [vmData, setVmData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Reusable fetch logic
    const fetchFullDetails = useCallback(async (isManual = false) => {
        if (isManual) setRefreshing(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vm/${vmId}?limit=50`);
            if (!res.ok) throw new Error("VM not found");

            const data = await res.json();
            if (data.metrics) {
                data.metrics = [...data.metrics].reverse();
            }
            setVmData(data);
        } catch (err) {
            console.error("Detail fetch error:", err);
        } finally {
            setLoading(false);
            // If manual refresh, keep the spin for 2 seconds as requested
            if (isManual) {
                setTimeout(() => setRefreshing(false), 2000);
            }
        }
    }, [vmId]);

    useEffect(() => {
        fetchFullDetails();
        const interval = setInterval(() => fetchFullDetails(), 5000);
        return () => clearInterval(interval);
    }, [fetchFullDetails]);

    // Mid-page Spinner for initial load
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="h-10 w-10 text-slate-500 animate-spin" />
                <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Initialising Telemetry...</p>
            </div>
        );
    }

    if (!vmData) return <div className="p-10 text-red-400">Error: Instance metadata unreachable.</div>;

    return (
        <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
            {/* Header with Status */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-8">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.push('/')}
                        className="border-slate-800 bg-slate-900 text-slate-400 hover:text-white cursor-pointer"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-50">{vmData.vmName}</h1>
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">ID: {vmId}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Force Refresh Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={refreshing}
                        onClick={() => fetchFullDetails(true)}
                        className="border-slate-800 bg-slate-900 text-slate-400 hover:text-white cursor-pointer h-9 px-3"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? "Refreshing..." : "Force Refresh"}
                    </Button>

                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${vmData.status === 'running' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                        vmData.status === 'stopped' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                            'bg-slate-500/10 border-slate-500/20 text-slate-500'
                        }`}>
                        <span className={`h-2 w-2 rounded-full ${vmData.status === 'running' ? 'bg-emerald-500 animate-pulse' : 'bg-current'}`}></span>
                        <span className="text-xs font-bold uppercase tracking-widest">{vmData.status}</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-[10px] font-mono text-slate-500 uppercase">Public IP</CardTitle>
                        <Globe className="h-3.5 w-3.5 text-slate-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold text-slate-200">{vmData.publicIp || "0.0.0.0"}</div>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">{vmData.hostname || "No Hostname"}</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-[10px] font-mono text-slate-500 uppercase">CPU Load</CardTitle>
                        <Cpu className="h-3.5 w-3.5 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold text-slate-200">{vmData.cpuUsedPct.toFixed(1)}%</div>
                        <div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full" style={{ width: `${vmData.cpuUsedPct}%` }}></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-[10px] font-mono text-slate-500 uppercase">RAM Usage</CardTitle>
                        <Database className="h-3.5 w-3.5 text-sky-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold text-slate-200">{vmData.ramUsedMB} MB</div>
                        <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase">Total: {vmData.ramTotalMB} MB</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-[10px] font-mono text-slate-500 uppercase">Disk Space</CardTitle>
                        <HardDrive className="h-3.5 w-3.5 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold text-slate-200">{vmData.diskUsedMB} MB</div>
                        <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase">Total: {vmData.diskTotalMB} MB</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* CPU Chart */}
                <Card className="bg-slate-900 border-slate-800 p-6 shadow-2xl">
                    <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-bold text-slate-400 flex items-center gap-2">
                            <Activity className="h-4 w-4 text-amber-500" /> CPU UTILIZATION TREND
                        </CardTitle>
                    </CardHeader>
                    <div className="h-75 w-full mt-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={vmData.metrics}>
                                <defs>
                                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis
                                    dataKey="timestamp"
                                    tickFormatter={(str) => new Date(str).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    stroke="#475569"
                                    fontSize={10}
                                />
                                <YAxis stroke="#475569" fontSize={10} tickFormatter={(val) => `${val}%`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                                />
                                <Area isAnimationActive={false} type="monotone" dataKey="cpuUsedPct" stroke="#f59e0b" fillOpacity={1} fill="url(#colorCpu)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* RAM Chart */}
                <Card className="bg-slate-900 border-slate-800 p-6 shadow-2xl">
                    <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-bold text-slate-400 flex items-center gap-2">
                            <Database className="h-4 w-4 text-sky-500" /> MEMORY CONSUMPTION TREND
                        </CardTitle>
                    </CardHeader>
                    <div className="h-75 w-full mt-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={vmData.metrics}>
                                <defs>
                                    <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis
                                    dataKey="timestamp"
                                    tickFormatter={(str) => new Date(str).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    stroke="#475569"
                                    fontSize={10}
                                />
                                <YAxis stroke="#475569" fontSize={10} tickFormatter={(val) => `${val}MB`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                                />
                                <Area isAnimationActive={false} type="monotone" dataKey="ramUsedMB" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorRam)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
}