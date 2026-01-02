"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface VM {
    vmId: string;
    vmName: string;
    ramUsedMB: number;
    ramTotalMB: number;
    cpuUsedPct: number;
    diskUsedMB: number;
    diskTotalMB: number;
    status: "running" | "stopped" | "error";
    hostname: string;
    publicIp: string;
    timestamp: string;
}

interface VMContextType {
    vms: VM[];
    loading: boolean;
    refreshVMs: () => Promise<void>;
}

const VMContext = createContext<VMContextType | undefined>(undefined);

export const VMProvider = ({ children }: { children: React.ReactNode }) => {
    const [vms, setVms] = useState<VM[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshVMs = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vm`);
            if (!response.ok) throw new Error("Failed to fetch VMs");

            const data = await response.json();
            setVms(data);
        } catch (error) {
            console.error("Context Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshVMs();
        const interval = setInterval(refreshVMs, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <VMContext.Provider value={{ vms, loading, refreshVMs }}>
            {children}
        </VMContext.Provider>
    );
};

export const useVMs = () => {
    const context = useContext(VMContext);
    if (!context) {
        throw new Error("useVMs must be used within a VMProvider");
    }
    return context;
};