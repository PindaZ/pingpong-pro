"use client";

import { Trophy, Target, Zap, Award } from "lucide-react";
import ResponsiveModal from "@/components/ui/ResponsiveModal";
import { X } from "lucide-react";

interface RulesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function RulesModal({ isOpen, onClose }: RulesModalProps) {
    if (!isOpen) return null;

    return (
        <ResponsiveModal isOpen={isOpen} onClose={onClose} className="max-w-2xl bg-slate-900/95">
            <div className="relative">
                {/* Custom Header (Sticky) */}
                <div className="sticky top-0 z-10 gradient-primary p-6 rounded-t-2xl md:rounded-t-2xl">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Trophy className="w-8 h-8" />
                        PingPong&#39;r Rules
                    </h2>
                    <p className="text-white/80 mt-1">Master the game, climb the ranks</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Match Rules */}
                    <section className="space-y-3">
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                            <Target className="w-5 h-5 text-primary" />
                            Match Format
                        </h3>
                        <ul className="space-y-2 text-slate-300 ml-7">
                            <li className="flex items-start gap-2">
                                <span className="text-primary font-bold">•</span>
                                Best of 3 sets wins the match
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary font-bold">•</span>
                                First to 11 points wins a set (win by 2)
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary font-bold">•</span>
                                Alternate serves every 2 points
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary font-bold">•</span>
                                At 10-10, alternate serves every point until 2-point lead
                            </li>
                        </ul>
                    </section>

                    {/* ELO System */}
                    <section className="space-y-3 bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                            <Zap className="w-5 h-5 text-yellow-400" />
                            ELO Rating System
                        </h3>
                        <ul className="space-y-2 text-slate-300 ml-7">
                            <li className="flex items-start gap-2">
                                <span className="text-yellow-400 font-bold">•</span>
                                All players start at <span className="font-mono text-primary">1200 ELO</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-yellow-400 font-bold">•</span>
                                Win against higher-rated players = bigger gains
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-yellow-400 font-bold">•</span>
                                Lose to lower-rated players = bigger losses
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-yellow-400 font-bold">•</span>
                                Ratings update after opponent confirms match result
                            </li>
                        </ul>
                    </section>

                    {/* Fair Play */}
                    <section className="space-y-3">
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                            <Award className="w-5 h-5 text-green-400" />
                            Fair Play
                        </h3>
                        <ul className="space-y-2 text-slate-300 ml-7">
                            <li className="flex items-start gap-2">
                                <span className="text-green-400 font-bold">•</span>
                                Log your matches honestly and promptly
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-400 font-bold">•</span>
                                Opponents must confirm match results
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-400 font-bold">•</span>
                                Disputed matches can be rejected
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-400 font-bold">•</span>
                                Have fun and respect your opponents!
                            </li>
                        </ul>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-6 pt-0">
                    <button
                        onClick={onClose}
                        className="w-full py-3 gradient-primary text-white font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-100"
                    >
                        Got it, let&apos;s play!
                    </button>
                </div>
            </div>
        </ResponsiveModal>
    );
}
