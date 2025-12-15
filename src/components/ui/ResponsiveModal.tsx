"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResponsiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string; // For custom width or styling
}

export default function ResponsiveModal({
    isOpen,
    onClose,
    title,
    children,
    className
}: ResponsiveModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Lock body scroll when modal is open
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    const content = (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end md:justify-center items-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Content Container */}
            <div
                className={cn(
                    "relative z-10 w-full md:w-auto md:max-w-lg md:rounded-2xl bg-slate-900 border-t md:border border-slate-800 shadow-2xl overflow-hidden",
                    // Mobile: Bottom Sheet Styles
                    "rounded-t-3xl max-h-[85vh] animate-slide-up md:animate-none",
                    // Desktop: Dialog Styles
                    "md:min-w-[400px] md:max-h-[90vh]",
                    className
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Mobile Drag Handle */}
                <div className="md:hidden w-full flex justify-center pt-3 pb-1" onClick={onClose}>
                    <div className="w-12 h-1.5 bg-slate-700/50 rounded-full" />
                </div>

                {/* Header */}
                {(title) && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
                        {title && <h3 className="text-lg font-bold text-white">{title}</h3>}
                        <button
                            onClick={onClose}
                            className="p-1 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}

                {/* Body */}
                <div className="overflow-y-auto custom-scrollbar max-h-[calc(85vh-80px)] md:max-h-[calc(90vh-80px)]">
                    {children}
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
}
