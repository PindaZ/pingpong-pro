"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Calendar, Users } from "lucide-react";
import ResponsiveModal from "@/components/ui/ResponsiveModal";

interface CreateTournamentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateTournamentModal({ isOpen, onClose }: CreateTournamentModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [maxParticipants, setMaxParticipants] = useState("16");

    const handleSubmit = async () => {
        if (!name || !startDate || !endDate) {
            setError("Please fill in all required fields");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/tournaments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    description,
                    startDate,
                    endDate,
                    maxParticipants: parseInt(maxParticipants),
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Failed to create tournament");
            } else {
                onClose();
                setName("");
                setDescription("");
                setStartDate("");
                setEndDate("");
                router.refresh();
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ResponsiveModal isOpen={isOpen} onClose={onClose} title="Create Tournament">
            <div className="p-6 space-y-4">
                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                        Tournament Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Winter Championship 2024"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                        Description (Optional)
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter tournament details, rules, prizes..."
                        rows={3}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                            <Calendar size={12} className="inline mr-1" />
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                        <Users size={12} className="inline mr-1" />
                        Max Participants
                    </label>
                    <select
                        value={maxParticipants}
                        onChange={(e) => setMaxParticipants(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="8">8 Players</option>
                        <option value="16">16 Players</option>
                        <option value="32">32 Players</option>
                    </select>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full py-3 rounded-lg btn-primary text-white font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : null}
                    Create Tournament
                </button>
            </div>
        </ResponsiveModal>
    );
}
