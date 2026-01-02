"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useVMs } from "@/context/VMContext";
import { Clock, Globe, Cpu, HardDrive } from "lucide-react";
import { useRouter } from "next/navigation";

function getRelativeTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 0 || isNaN(diffInSeconds)) return "N/A";
    if (diffInSeconds < 60) return "Just now";
    const mins = Math.floor(diffInSeconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString() === "1/1/1970" ? "N/A" : date.toLocaleDateString();
}

export function VMTable() {
    const { vms, loading } = useVMs();
    const router = useRouter();

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4 border border-slate-800 rounded-xl bg-slate-900/50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400"></div>
                <p className="text-slate-500 font-mono text-sm">SYNCING_TELEMETRY...</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-2xl no-scrollbar">
            <Table>
                <TableHeader className="bg-slate-900/80">
                    <TableRow className="border-slate-800 hover:bg-transparent">
                        {/* Added px-6 and py-4 for more header space */}
                        <TableHead className="px-6 py-5 text-slate-400 font-mono text-xs uppercase tracking-wider">Instance Name</TableHead>
                        <TableHead className="px-6 py-5 text-slate-400 font-mono text-xs uppercase tracking-wider">Status</TableHead>
                        <TableHead className="px-6 py-5 text-slate-400 font-mono text-xs uppercase tracking-wider">Network Info</TableHead>
                        <TableHead className="px-6 py-5 text-slate-400 font-mono text-xs uppercase tracking-wider text-right">Resource Load</TableHead>
                        <TableHead className="px-6 py-5 text-slate-400 font-mono text-xs uppercase tracking-wider text-right">Last Heartbeat</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {vms.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-32 text-center text-slate-500 italic">
                                No telemetry received yet.
                            </TableCell>
                        </TableRow>
                    ) : (
                        vms.map((vm) => (
                            <TableRow key={vm.vmId} className="border-slate-800 hover:bg-slate-800/40 transition-colors group cursor-pointer" onClick={() => router.push(`/${vm.vmId}`)}>
                                {/* VM Name Cell: Added py-5 for vertical breathing room */}
                                <TableCell className="px-6 py-5 font-semibold text-slate-200">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm">{vm.vmName}</span>
                                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter opacity-70 group-hover:opacity-100">
                                            {vm.hostname || "Unknown Host"}
                                        </span>
                                    </div>
                                </TableCell>

                                {/* Status Badge Cell */}
                                <TableCell className="px-6 py-5">
                                    <Badge
                                        variant="outline"
                                        className={
                                            vm.status === "running"
                                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-3 py-1"
                                                : vm.status === "stopped"
                                                    ? "bg-red-500/10 text-red-500 border-red-500/20 px-3 py-1"
                                                    : "bg-slate-500/10 text-slate-500 border-slate-500/20 px-3 py-1"
                                        }
                                    >
                                        <span className={`h-1.5 w-1.5 rounded-full mr-2 ${vm.status === 'running' ? 'bg-emerald-500 animate-pulse' : vm.status === 'stopped' ? 'bg-red-500' : 'bg-slate-500'}`}></span>
                                        {vm.status.toUpperCase()}
                                    </Badge>
                                </TableCell>

                                {/* Network Info Cell */}
                                <TableCell className="px-6 py-5">
                                    <div className="flex items-center text-xs text-slate-400 font-mono">
                                        <Globe className="h-3.5 w-3.5 mr-2 text-slate-600" />
                                        {vm.publicIp || "0.0.0.0"}
                                    </div>
                                </TableCell>

                                {/* Resource Load Cell */}
                                <TableCell className="px-6 py-5 text-right">
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex items-center text-xs text-slate-300">
                                            <Cpu className="h-3.5 w-3.5 mr-2 text-slate-500" />
                                            <span className="font-medium">{vm.cpuUsedPct.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex items-center text-[10px] text-slate-500">
                                            <HardDrive className="h-3 w-3 mr-2" />
                                            {vm.ramUsedMB} MB / {vm.ramTotalMB} MB
                                        </div>
                                    </div>
                                </TableCell>

                                {/* Heartbeat Cell */}
                                <TableCell className="px-6 py-5 text-right">
                                    <div className="flex items-center justify-end text-xs text-slate-500">
                                        <Clock className="h-3.5 w-3.5 mr-2 text-slate-600" />
                                        {getRelativeTime(vm.timestamp)}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}