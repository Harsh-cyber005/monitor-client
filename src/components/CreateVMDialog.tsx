"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useVMs } from "@/context/VMContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Copy, Check, Terminal, Loader2, AlertCircle } from "lucide-react";

const LS_KEY = "pending_vm_setup_v2";
const LS_TTL = 12 * 60 * 60 * 1000;

export function CreateVMDialog() {
    const { refreshVMs } = useVMs();
    const [isOpen, setIsOpen] = useState(false);
    const [vmName, setVmName] = useState("");
    const [loading, setLoading] = useState(false);
    const [setupData, setSetupData] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Function to play a clean success "tick" sound
    const playSuccessSound = () => {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
        audio.volume = 0.5;
        audio.play().catch(e => console.log("Audio block:", e));
    };

    const resetState = useCallback(() => {
        localStorage.removeItem(LS_KEY);
        setSetupData(null);
        setVmName("");
        setIsInstalled(false);
        setError(null);
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem(LS_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Date.now() - parsed.timestamp < LS_TTL) {
                setVmName(parsed.vmName);
                setSetupData(parsed.setupData);
            } else {
                localStorage.removeItem(LS_KEY);
            }
        }
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        const checkStatus = async () => {
            if (!setupData?.pollingLink) return;
            try {
                const res = await fetch(setupData.pollingLink);
                const status = await res.json();

                if (status === 1) {
                    playSuccessSound(); // 🔊 Play sound on success
                    setIsInstalled(true);
                    refreshVMs();
                    localStorage.removeItem(LS_KEY);

                    // 5-Second delay before closing as requested
                    setTimeout(() => {
                        setIsOpen(false);
                        setTimeout(resetState, 500);
                    }, 5000);
                } else if (status < 0) {
                    setError("TOKEN EXPIRED");
                    resetState();
                }
            } catch (e) { console.error(e); }
        };

        if (isOpen && setupData && !isInstalled) {
            checkStatus();
            interval = setInterval(checkStatus, 5000);
        }
        return () => clearInterval(interval);
    }, [isOpen, setupData, isInstalled, refreshVMs, resetState]);

    const copyToClipboard = () => {
        if (!setupData?.command) return;
        const text = setupData.command;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }).catch(() => {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };

    const handleCreate = async () => {
        if (!vmName.trim()) return;
        setLoading(true); setError(null);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vm/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vmName }),
            });
            if (!res.ok) throw new Error("DUPLICATE NAME");
            const data = await res.json();
            setSetupData(data);
            localStorage.setItem(LS_KEY, JSON.stringify({ vmName, setupData: data, timestamp: Date.now() }));
        } catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-white hover:bg-neutral-200 text-black font-bold h-9 px-4 rounded-none transition-all cursor-pointer">
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline text-[10px] uppercase tracking-widest font-bold">New Instance</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-black border border-neutral-800 rounded-none sm:max-w-115 p-0 overflow-hidden outline-none">
                <div className="p-8 space-y-6">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold tracking-tighter text-white uppercase">Provisioning</DialogTitle>
                        <DialogDescription className="text-neutral-500 text-[10px] font-mono uppercase tracking-[0.3em]">Infrastructure Scale Engine</DialogDescription>
                    </DialogHeader>

                    {isInstalled ? (
                        <div className="py-14 flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
                            <div className="h-24 w-24 rounded-full border-2 border-emerald-500 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.2)] bg-emerald-500/5">
                                <Check className="h-12 w-12 text-emerald-500 stroke-[3px]" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-emerald-500 font-bold text-sm uppercase tracking-[0.3em]">Agent Online</h3>
                                <p className="text-neutral-500 text-[9px] font-mono animate-pulse uppercase">Dashboard will sync in 5s...</p>
                            </div>
                        </div>
                    ) : !setupData ? (
                        <div className="space-y-5 pb-2">
                            {error && <div className="text-[10px] font-mono text-red-500 flex items-center gap-2 bg-red-500/5 p-3 border border-red-500/10 uppercase tracking-tighter"><AlertCircle className="h-3 w-3" /> {error}</div>}
                            <div className="space-y-2">
                                <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest ml-1">Instance Label</label>
                                <Input
                                    placeholder="e.g. production-server-01"
                                    value={vmName}
                                    onChange={(e) => setVmName(e.target.value)}
                                    className="bg-black border-neutral-800 focus:border-white rounded-none text-sm h-12 font-mono" // 👈 Removed 'uppercase'
                                />
                            </div>
                            <Button onClick={handleCreate} disabled={loading || !vmName} className="w-full bg-white text-black hover:bg-neutral-200 font-bold rounded-none h-12 uppercase text-[10px] tracking-[0.2em] cursor-pointer">
                                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Authorize & Generate"}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6 pb-2 animate-in fade-in">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                                    <span className="text-[10px] font-mono text-blue-500 uppercase tracking-widest font-bold">Awaiting Handshake...</span>
                                </div>
                            </div>
                            <div className="p-5 bg-neutral-900/50 border border-neutral-800 relative group transition-all hover:border-neutral-700">
                                <pre className="text-[11px] font-mono text-neutral-300 break-all whitespace-pre-wrap leading-relaxed pr-6">{setupData.command}</pre>
                                <Button size="icon" variant="ghost" className="absolute top-2 right-2 text-neutral-500 hover:text-white cursor-pointer" onClick={copyToClipboard}>
                                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                            <p className="text-[9px] text-neutral-600 font-mono text-center uppercase tracking-tighter leading-relaxed">
                                Copy the command above and execute it with root privileges on your remote instance.
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}