"use client";

import { useState, useEffect, useCallback } from "react";
import { useVMs } from "@/context/VMContext";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Copy, Check, Terminal, Loader2, AlertCircle } from "lucide-react";

const LS_KEY = "pending_vm_setup_v2";
const LS_TTL = 12 * 60 * 60 * 1000; // 12 Hours

export function CreateVMDialog() {
    const { refreshVMs } = useVMs();

    // UI & Visibility States
    const [isOpen, setIsOpen] = useState(false);
    const [vmName, setVmName] = useState("");
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Polling & Success States
    const [setupData, setSetupData] = useState<{ command: string; pollingLink: string } | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);

    // --- Helper: Reset everything ---
    const resetState = useCallback(() => {
        localStorage.removeItem(LS_KEY);
        setSetupData(null);
        setVmName("");
        setIsInstalled(false);
        setError(null);
    }, []);

    // --- Persistence Check ---
    useEffect(() => {
        const saved = localStorage.getItem(LS_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            const isExpired = Date.now() - parsed.timestamp > LS_TTL;

            if (isExpired) {
                localStorage.removeItem(LS_KEY);
            } else {
                setVmName(parsed.vmName);
                setSetupData(parsed.setupData);
            }
        }
    }, []);

    // --- Polling Logic ---
    useEffect(() => {
        let interval: NodeJS.Timeout;

        const checkStatus = async () => {
            if (!setupData?.pollingLink) return;
            try {
                const res = await fetch(setupData.pollingLink);
                const status = await res.json();

                if (status === 1) { // Correct Usage
                    setIsInstalled(true);
                    refreshVMs();
                    localStorage.removeItem(LS_KEY);

                    setTimeout(() => {
                        setIsOpen(false);
                        setTimeout(resetState, 500);
                    }, 3000);
                } else if (status < 0) {
                    setError(status === -2 ? "Installation token expired" : "Token no longer valid");
                    resetState();
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        };

        if (isOpen && setupData && !isInstalled) {
            checkStatus();
            interval = setInterval(checkStatus, 5000);
        }

        return () => clearInterval(interval);
    }, [isOpen, setupData, isInstalled, refreshVMs, resetState]);

    // --- Copy Logic from your working snippet ---
    const fallbackCopy = (text: string) => {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand("copy");
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Fallback copy failed", err);
        }
        document.body.removeChild(textarea);
    };

    const copyToClipboard = () => {
        if (!setupData?.command) return;

        const textToCopy = setupData.command;

        if (navigator.clipboard) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }).catch(() => {
                fallbackCopy(textToCopy);
            });
        } else {
            fallbackCopy(textToCopy);
        }
    };

    const handleCreate = async () => {
        if (!vmName.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vm/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vmName }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.error || "Failed to create VM");
                return;
            }

            const data = await response.json();
            setSetupData(data); //

            localStorage.setItem(LS_KEY, JSON.stringify({
                vmName,
                setupData: data,
                timestamp: Date.now()
            }));

        } catch (err) {
            setError("Server unreachable. Try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-slate-50 hover:bg-slate-200 text-slate-950 font-bold h-10 px-4 cursor-pointer shadow-lg shadow-blue-500/10">
                    <Plus className="mr-2 h-4 w-4" /> Add New Instance
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-125 bg-slate-900 border-slate-800 text-slate-50 shadow-2xl outline-none">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold tracking-tight">
                        {isInstalled ? "Provisioning Complete" : "Register New Instance"}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        {isInstalled
                            ? "Agent detected. Infrastructure updated successfully."
                            : "Connect a remote server to your monitoring dashboard."}
                    </DialogDescription>
                </DialogHeader>

                {isInstalled ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-500">
                        <div className="h-20 w-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                            <Check className="h-10 w-10 text-emerald-500 stroke-[3px] animate-in slide-in-from-bottom-2 duration-500" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-emerald-400 font-bold text-lg font-mono tracking-tighter uppercase">Token Used</h3>
                            <p className="text-slate-500 text-xs animate-pulse">Auto-closing in 3 seconds...</p>
                        </div>
                    </div>
                ) : !setupData ? (
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
                                    <AlertCircle className="h-4 w-4" /> {error}
                                </div>
                            )}
                            <label className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest">Instance Name</label>
                            <Input
                                placeholder="e.g. aws-production-01"
                                value={vmName}
                                onChange={(e) => setVmName(e.target.value)}
                                className="bg-slate-950 border-slate-800 focus:border-slate-600 focus:ring-0 h-11 font-mono text-sm"
                                disabled={loading}
                            />
                        </div>
                        <Button
                            onClick={handleCreate}
                            disabled={loading || !vmName}
                            className="w-full bg-slate-50 hover:bg-slate-200 text-slate-950 font-bold h-11 transition-all cursor-pointer shadow-xl"
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "GENERATE SETUP SCRIPT"}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6 py-4 animate-in fade-in duration-500">
                        <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                                <p className="text-xs text-blue-400 font-bold tracking-tight">AWAITING AGENT CONNECTION...</p>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">POLLING...</span>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold font-mono text-slate-500 flex items-center uppercase tracking-widest">
                                <Terminal className="h-3 w-3 mr-2 text-slate-400" /> Execute on Remote VM
                            </label>
                            <div className="relative bg-slate-950 border-2 border-slate-800 rounded-lg group overflow-hidden">
                                <pre className="p-4 bg-slate-950 rounded-lg text-[11px] text-blue-400 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed font-mono mr-8">
                                    {setupData.command}
                                </pre>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="absolute top-2 right-2 h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                                    onClick={copyToClipboard}
                                >
                                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-500 text-center bg-slate-900/50 py-2 rounded border border-slate-800/50">
                            * Paste this command into your remote server's terminal to begin telemetry.
                        </p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}