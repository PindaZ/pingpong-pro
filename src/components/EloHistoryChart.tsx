"use client";

import { useMemo, useState } from "react";

interface EloHistoryChartProps {
    data: {
        date: Date;
        elo: number;
    }[];
}

export function EloHistoryChart({ data }: EloHistoryChartProps) {
    const [hoveredPoint, setHoveredPoint] = useState<{ x: number, y: number, value: number, date: Date } | null>(null);

    // Filter to last 20 games if too many
    const chartData = data.slice(-20);

    if (chartData.length < 2) {
        return (
            <div className="flex items-center justify-center h-[300px] bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-500 font-medium">
                Not enough data for history graph
            </div>
        );
    }

    const { points, width, height, minElo, maxElo } = useMemo(() => {
        const width = 1000; // Intrinsic SVG width
        const height = 300; // Intrinsic SVG height
        const padding = { top: 20, right: 20, bottom: 30, left: 40 };

        const eloValues = chartData.map(d => d.elo);
        const minElo = Math.min(...eloValues) - 20;
        const maxElo = Math.max(...eloValues) + 20;
        const eloRange = maxElo - minElo;

        const points = chartData.map((d, i) => {
            const x = padding.left + (i / (chartData.length - 1)) * (width - padding.left - padding.right);
            const y = height - padding.bottom - ((d.elo - minElo) / eloRange) * (height - padding.top - padding.bottom);
            return { x, y, value: d.elo, date: d.date };
        });

        return { points, width, height, minElo, maxElo };
    }, [chartData]);

    // Create path string
    const pathD = points.length > 0
        ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ")
        : "";

    // Create gradient fill path (closed loop)
    const fillPathD = pathD
        ? `${pathD} L ${points[points.length - 1].x} ${height - 20} L ${points[0].x} ${height - 20} Z`
        : "";

    return (
        <div className="w-full bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm shadow-xl">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    ELO History
                    <span className="text-xs font-normal text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">Last {chartData.length} games</span>
                </h3>
                {hoveredPoint ? (
                    <div className="text-sm font-mono text-primary">
                        {hoveredPoint.value} <span className="text-slate-500">on {hoveredPoint.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                ) : (
                    <div className="text-sm font-mono text-slate-500">
                        Avg: {Math.round(chartData.reduce((a, b) => a + b.elo, 0) / chartData.length)}
                    </div>
                )}
            </div>

            <div className="relative w-full aspect-[16/9] md:aspect-[3/1] select-none">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full h-full overflow-visible"
                    preserveAspectRatio="none"
                    onMouseLeave={() => setHoveredPoint(null)}
                >
                    <defs>
                        <linearGradient id="eloGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                        </linearGradient>
                    </defs>

                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                        const y = 20 + tick * (height - 50);
                        return (
                            <line
                                key={tick} x1="40" y1={y} x2={width - 20} y2={y}
                                stroke="#334155" strokeWidth="1" strokeDasharray="4 4"
                            />
                        );
                    })}

                    {/* Area Fill */}
                    <path d={fillPathD} fill="url(#eloGradient)" />

                    {/* Line */}
                    <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Hover Hotspots & Points */}
                    {points.map((p, i) => (
                        <g key={i} className="group">
                            {/* Visible Dot on Hover */}
                            <circle
                                cx={p.x} cy={p.y} r="4"
                                className={`transition-all duration-200 fill-slate-900 stroke-indigo-500 stroke-2 ${hoveredPoint === p ? "r-6 stroke-white fill-indigo-500" : "opacity-0 group-hover:opacity-100"}`}
                            />
                            {/* Invisible interaction target */}
                            <rect
                                x={p.x - (width / points.length / 2)}
                                y="0"
                                width={width / points.length}
                                height={height}
                                fill="transparent"
                                onMouseEnter={() => setHoveredPoint(p)}
                            />
                        </g>
                    ))}
                </svg>
            </div>
        </div>
    );
}
