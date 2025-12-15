"use client";

import { useState } from "react";
import { Swords, Loader2, Check } from "lucide-react";

interface ChallengeButtonProps {
    challengedUserId: string;
    challengedUserName: string;
}

export default function ChallengeButton({ challengedUserId, challengedUserName }: ChallengeButtonProps) {
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    const handleChallenge = async () => {
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/challenge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ challengedUserId }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Failed to send challenge");
            } else {
                setSent(true);
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <button
                disabled
                className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center gap-2"
            >
                <Check size={20} />
                Challenge Sent!
            </button>
        );
    }

    return (
        <div className="space-y-2">
            <button
                onClick={handleChallenge}
                disabled={loading}
                className="w-full py-3 rounded-xl btn-primary text-white font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
                {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                ) : (
                    <Swords size={20} />
                )}
                Challenge {challengedUserName.split(" ")[0]}
            </button>
            {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
            )}
        </div>
    );
}
