"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useVMs } from "@/context/VMContext";
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

    if (loading) return <div className="p-10 text-center text-neutral-600 font-mono text-xs animate-pulse uppercase tracking-widest">Syncing_Nodes...</div>;

    return (
        <div className="border border-neutral-800 bg-black overflow-hidden rounded-none">
            <Table>
                <TableHeader className="bg-neutral-900/50">
                    <TableRow className="border-neutral-800 hover:bg-transparent">
                        <TableHead className="h-10 px-4 text-neutral-500 font-mono text-[10px] uppercase tracking-widest">Instance</TableHead>
                        <TableHead className="h-10 px-4 text-neutral-500 font-mono text-[10px] uppercase tracking-widest">Status</TableHead>
                        <TableHead className="h-10 px-4 text-neutral-500 font-mono text-[10px] uppercase tracking-widest hidden sm:table-cell">Endpoint</TableHead>
                        <TableHead className="h-10 px-4 text-neutral-500 font-mono text-[10px] uppercase tracking-widest text-right">CPU</TableHead>
                        <TableHead className="h-10 px-4 text-neutral-500 font-mono text-[10px] uppercase tracking-widest text-right">Last Heartbeat</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {vms.length === 0 ? (
                        <TableRow className="border-none hover:bg-transparent">
                            <TableCell colSpan={5} className="h-40 text-center text-neutral-600 font-mono text-xs uppercase tracking-widest">No_Instances_Detected</TableCell>
                        </TableRow>
                    ) : (
                        vms.map((vm) => (
                            <TableRow
                                key={vm.vmId}
                                onClick={() => router.push(`/${vm.vmId}`)}
                                className="border-neutral-800 hover:bg-neutral-900/50 transition-colors cursor-pointer group"
                            >
                                <TableCell className="px-4 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold tracking-tight">{vm.vmName}</span>
                                        <span className="text-[10px] text-neutral-600 font-mono uppercase hidden sm:block">{vm.hostname || "Not Provisioned"}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="px-4 py-4">
                                    <div className="flex items-center gap-2.5">
                                        {/* Status Dot with Glow */}
                                        <div className={`h-1.5 w-1.5 rounded-full transition-all duration-500 ${vm.status === 'running'
                                                ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)] animate-pulse'
                                                : vm.status === 'stopped'
                                                    ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                                                    : 'bg-neutral-600'
                                            }`} />

                                        {/* Status Text with subtle color */}
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${vm.status === 'running'
                                                ? 'text-emerald-500/90'
                                                : vm.status === 'stopped'
                                                    ? 'text-red-500/90'
                                                    : 'text-neutral-500'
                                            }`}>
                                            {vm.status}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="px-4 py-4 hidden sm:table-cell text-[10px] text-neutral-500 font-mono">
                                    {vm.publicIp || "0.0.0.0"}
                                </TableCell>
                                <TableCell className="px-4 py-4 text-right font-mono text-xs text-neutral-300">
                                    {vm.cpuUsedPct.toFixed(1)}%
                                </TableCell>
                                <TableCell className="px-4 py-4 text-right">
                                    <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-tighter">
                                        {getRelativeTime(vm.timestamp)}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}