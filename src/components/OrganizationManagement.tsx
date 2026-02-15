"use client";

import { useState, useEffect } from "react";
import { Copy, Check, QrCode, Users, Globe, Hash, Shield } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { cn } from "@/lib/utils";

interface Organization {
    id: string;
    name: string;
    inviteCode: string;
    createdAt: string;
    _count: {
        members: number;
    };
}

export default function OrganizationManagement() {
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [baseUrl, setBaseUrl] = useState("");

    useEffect(() => {
        fetchOrganization();
        if (typeof window !== "undefined") {
            setBaseUrl(window.location.origin);
        }
    }, []);

    const fetchOrganization = async () => {
        try {
            const res = await fetch("/api/organization");
            if (res.ok) {
                const data = await res.json();
                setOrganization(data);
            }
        } catch (error) {
            console.error("Failed to fetch organization:", error);
        } finally {
            setLoading(false);
        }
    };

    const copyInviteLink = () => {
        if (!organization) return;
        const link = `${baseUrl}/register?code=${organization.inviteCode}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return <div className="animate-pulse space-y-4">
            <div className="h-32 bg-slate-800 rounded-2xl" />
            <div className="h-64 bg-slate-800 rounded-2xl" />
        </div>;
    }

    if (!organization) return null;

    const inviteLink = `${baseUrl}/register?code=${organization.inviteCode}`;

    return (
        <div className="space-y-6">
            {/* Org Overview */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-3xl font-bold text-white">
                        {organization.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">{organization.name}</h3>
                        <p className="text-sm text-slate-400">
                            Established {new Date(organization.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">
                            <Users size={14} /> Members
                        </div>
                        <div className="text-2xl font-bold text-white">{organization._count.members}</div>
                    </div>
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">
                            <Shield size={14} /> Status
                        </div>
                        <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active
                        </div>
                    </div>
                </div>
            </div>

            {/* Invite Section */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-6">
                    <Globe className="text-primary" size={20} />
                    <h3 className="text-lg font-semibold text-white">Recruitment</h3>
                </div>

                <div className="space-y-6">
                    {/* Invite Code */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                            Organization Invite Code
                        </label>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 font-mono text-primary font-bold tracking-widest text-lg">
                                {organization.inviteCode}
                            </div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(organization.inviteCode);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                }}
                                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all active:scale-95"
                            >
                                {copied ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* QR Code */}
                    <div className="flex flex-col md:flex-row gap-6 items-center p-6 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                        <div className="bg-white p-3 rounded-xl shadow-2xl shadow-primary/20">
                            <QRCodeCanvas
                                value={inviteLink}
                                size={140}
                                level="H"
                                includeMargin={false}
                                imageSettings={{
                                    src: "/logo.png", // Fallback if exists
                                    x: undefined,
                                    y: undefined,
                                    height: 24,
                                    width: 24,
                                    excavate: true,
                                }}
                            />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h4 className="text-white font-semibold flex items-center justify-center md:justify-start gap-2">
                                <QrCode size={18} className="text-primary" />
                                Instant Join QR
                            </h4>
                            <p className="text-sm text-slate-400 mt-2 mb-4">
                                Players can scan this to join <span className="text-white font-medium">{organization.name}</span> instantly. Perfect for display in the break room!
                            </p>
                            <button
                                onClick={copyInviteLink}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 rounded-lg text-sm font-medium transition-all"
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                {copied ? "Copied Link!" : "Copy Join URL"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
