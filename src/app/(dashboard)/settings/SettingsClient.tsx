"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings, Palette, Save, Loader2, Check, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserSettings {
    id: string;
    primaryColor: string;
    secondaryColor: string;
}

const presetColors = [
    { name: "Indigo", primary: "#6366f1", secondary: "#8b5cf6" },
    { name: "Blue", primary: "#3b82f6", secondary: "#06b6d4" },
    { name: "Emerald", primary: "#10b981", secondary: "#22c55e" },
    { name: "Rose", primary: "#f43f5e", secondary: "#ec4899" },
    { name: "Orange", primary: "#f97316", secondary: "#eab308" },
    { name: "Slate", primary: "#475569", secondary: "#64748b" },
];

export default function SettingsClient({ isAdmin }: { isAdmin: boolean }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [primaryColor, setPrimaryColor] = useState("#6366f1");
    const [secondaryColor, setSecondaryColor] = useState("#8b5cf6");
    const [error, setError] = useState("");

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/settings");
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
                setPrimaryColor(data.primaryColor);
                setSecondaryColor(data.secondaryColor);
            }
        } catch (err) {
            console.error("Failed to fetch settings:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        setSaved(false);

        try {
            const res = await fetch("/api/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ primaryColor, secondaryColor }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Failed to save settings");
            } else {
                setSaved(true);
                // Apply colors immediately
                document.documentElement.style.setProperty("--color-primary", primaryColor);
                document.documentElement.style.setProperty("--color-secondary", secondaryColor);
                setTimeout(() => setSaved(false), 2000);
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setSaving(false);
        }
    };

    const applyPreset = (preset: typeof presetColors[0]) => {
        setPrimaryColor(preset.primary);
        setSecondaryColor(preset.secondary);
    };

    const resetToDefault = () => {
        setPrimaryColor("#6366f1");
        setSecondaryColor("#8b5cf6");
    };

    if (!isAdmin) {
        return (
            <div className="max-w-2xl mx-auto text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                    <Settings size={32} className="text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
                <p className="text-slate-400">Only administrators can access settings.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="animate-spin text-indigo-400" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <Settings className="text-indigo-400" />
                    Settings
                </h2>
                <p className="text-slate-400 mt-1">Customize the app appearance</p>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                    {error}
                </div>
            )}

            {/* Color Palette Section */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-6">
                    <Palette className="text-purple-400" size={20} />
                    <h3 className="text-lg font-semibold text-white">Color Palette</h3>
                </div>

                {/* Preset Colors */}
                <div className="mb-6">
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
                        Presets
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {presetColors.map((preset) => (
                            <button
                                key={preset.name}
                                onClick={() => applyPreset(preset)}
                                className={cn(
                                    "p-3 rounded-xl border transition-all hover:scale-105",
                                    primaryColor === preset.primary && secondaryColor === preset.secondary
                                        ? "border-white ring-2 ring-white/20"
                                        : "border-slate-700 hover:border-slate-600"
                                )}
                            >
                                <div className="flex gap-1 mb-2">
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: preset.primary }}
                                    />
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: preset.secondary }}
                                    />
                                </div>
                                <span className="text-xs text-slate-400">{preset.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Colors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                            Primary Color
                        </label>
                        <div className="flex items-center gap-2 md:gap-3">
                            <input
                                type="color"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="w-10 h-10 md:w-12 md:h-12 rounded-lg border border-slate-700 cursor-pointer bg-transparent flex-shrink-0"
                            />
                            <input
                                type="text"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="#6366f1"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                            Secondary Color
                        </label>
                        <div className="flex items-center gap-2 md:gap-3">
                            <input
                                type="color"
                                value={secondaryColor}
                                onChange={(e) => setSecondaryColor(e.target.value)}
                                className="w-10 h-10 md:w-12 md:h-12 rounded-lg border border-slate-700 cursor-pointer bg-transparent flex-shrink-0"
                            />
                            <input
                                type="text"
                                value={secondaryColor}
                                onChange={(e) => setSecondaryColor(e.target.value)}
                                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="#8b5cf6"
                            />
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div className="mb-6 p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
                        Preview
                    </label>
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <button
                            className="w-full md:w-auto px-4 py-2 rounded-lg font-medium text-white transition-all"
                            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                        >
                            Primary Button
                        </button>
                        <div
                            className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-white font-bold text-lg md:text-xl flex-shrink-0"
                            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                        >
                            JD
                        </div>
                        <div className="w-full md:flex-1 h-2 rounded-full" style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` }} />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={resetToDefault}
                        className="px-4 py-2.5 rounded-lg bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-all flex items-center gap-2"
                    >
                        <RefreshCw size={16} />
                        Reset to Default
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                    >
                        {saving ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : saved ? (
                            <Check size={18} />
                        ) : (
                            <Save size={18} />
                        )}
                        {saved ? "Saved!" : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}
