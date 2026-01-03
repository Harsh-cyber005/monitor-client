"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Loader2, Globe, Cpu, Database } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function VMDetailPage() {
    const { vmId } = useParams();
    const router = useRouter();
    const [vmData, setVmData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchFullDetails = useCallback(async (manual = false) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vm/${vmId}?limit=50`);
            const data = await res.json();
            if (data.metrics) data.metrics = [...data.metrics].reverse();
            setVmData(data);
        } catch (err) {
            console.error("Detail fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [vmId]);

    useEffect(() => {
        fetchFullDetails();
        const itv = setInterval(() => fetchFullDetails(), 5000);
        return () => clearInterval(itv);
    }, [fetchFullDetails]);

    if (loading) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-6 w-6 text-neutral-600 animate-spin" />
            <p className="text-neutral-600 font-mono text-[10px] uppercase tracking-widest">Fetching Metrics</p>
        </div>
    );

    if (!vmData) return <div className="min-h-screen bg-black text-red-500 p-10 font-mono text-xs uppercase tracking-widest">Error: Instance_Unreachable</div>;

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-10 selection:bg-white selection:text-black">
            <div className="max-w-7xl mx-auto space-y-10">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-neutral-800 pb-8">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => router.push('/')} className="border-neutral-800 bg-black hover:bg-neutral-900 rounded-none cursor-pointer">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tighter">{vmData.vmName}</h1>
                            <p className="text-neutral-500 font-mono text-[10px] uppercase mt-1 tracking-widest">{vmId}</p>
                        </div>
                    </div>

                    {/* CUSTOM SYNC BUTTON WITH 2s DELAY */}
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={refreshing}
                        onClick={() => {
                            setRefreshing(true);
                            fetchFullDetails(true);
                            setTimeout(() => setRefreshing(false), 2000);
                        }}
                        className="bg-black border-neutral-800 hover:bg-neutral-900 text-neutral-400 h-9 px-3 rounded-none transition-all cursor-pointer"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline text-xs uppercase tracking-widest font-bold">Sync Data</span>
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-neutral-800 border border-neutral-800">
                    {[
                        { label: "IP Address", val: vmData.publicIp || "0.0.0.0", icon: Globe },
                        { label: "CPU Load", val: `${vmData.cpuUsedPct.toFixed(1)}%`, icon: Cpu },
                        { label: "Memory", val: `${vmData.ramUsedMB}MB`, icon: Database },
                    ].map((s, i) => (
                        <div key={i} className="bg-black p-6">
                            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <s.icon className="h-3 w-3" /> {s.label}
                            </p>
                            <p className="text-xl font-bold tracking-tight">{s.val}</p>
                        </div>
                    ))}
                    <div className={`flex items-center gap-2 px-6 py-1.5 border transition-colors ${vmData.status === 'running'
                        ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500'
                        : vmData.status === 'stopped'
                            ? 'bg-red-500/5 border-red-500/20 text-red-500'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-500'
                        }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${vmData.status === 'running' ? 'bg-emerald-500 animate-pulse' :
                            vmData.status === 'stopped' ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-neutral-600'
                            }`} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{vmData.status}</span>
                    </div>
                </div>

                {/* Chart Area */}
                <div className="grid gap-4 lg:grid-cols-2">
                    {/* CPU Usage Chart - Amber (Mirrored Axis) */}
                    <Card className="bg-black border-neutral-800 rounded-none p-6 shadow-none">
                        <p className="text-[10px] font-mono text-neutral-500 uppercase mb-6 tracking-widest flex justify-between items-center">
                            <span>CPU USAGE OVER TIME</span>
                            <span className="text-neutral-700">% LOAD</span>
                        </p>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={vmData.metrics} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#171717" vertical={false} />
                                    <XAxis dataKey="timestamp" hide />
                                    <YAxis
                                        mirror={true} // 👈 Labels inside graph
                                        stroke="#525252"
                                        fontSize={9}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(val) => `${val}%`}
                                    />
                                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #262626', fontSize: '10px' }} labelStyle={{ display: 'none' }} />
                                    <Area isAnimationActive={false} type="monotone" dataKey="cpuUsedPct" stroke="#f59e0b" fillOpacity={1} fill="url(#colorCpu)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* RAM Consumption Chart - Blue (Mirrored Axis) */}
                    <Card className="bg-black border-neutral-800 rounded-none p-6 shadow-none">
                        <p className="text-[10px] font-mono text-neutral-500 uppercase mb-6 tracking-widest flex justify-between items-center">
                            <span>RAM CONSUMPTION</span>
                            <span className="text-neutral-700">UNIT: MB</span>
                        </p>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={vmData.metrics} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#171717" vertical={false} />
                                    <XAxis dataKey="timestamp" hide />
                                    <YAxis
                                        mirror={true} // 👈 Labels inside graph
                                        stroke="#525252"
                                        fontSize={9}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(val) => `${val}MB`}
                                    />
                                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #262626', fontSize: '10px' }} labelStyle={{ display: 'none' }} />
                                    <Area isAnimationActive={false} type="monotone" dataKey="ramUsedMB" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRam)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}