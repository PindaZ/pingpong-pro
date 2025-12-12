import { ClassValue } from "clsx";
import { cn } from "@/lib/utils";

interface LogoProps {
    className?: ClassValue;
}

export function Logo({ className }: LogoProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("w-8 h-8", className)}
        >
            {/* Crossed Bats */}
            <path d="M30 30 L70 70" className="opacity-80" />
            <path d="M70 30 L30 70" className="opacity-80" />

            {/* Bat Heads (suggested shapes) */}
            <circle cx="30" cy="30" r="15" className="fill-current opacity-20" />
            <circle cx="70" cy="30" r="15" className="fill-current opacity-20" />

            {/* Handles */}
            <line x1="25" y1="25" x2="15" y2="15" />
            <line x1="75" y1="25" x2="85" y2="15" />
        </svg>
    );
}

// A more detailed version for the sidebar
export function PingPongrLogo({ className }: LogoProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("w-6 h-6", className)}
        >
            <path d="M6 18h12" />
            <path d="M6 14h12" />
            <path d="M12 10v8" />
            <path d="M12 2a4 4 0 0 1 4 4v4H8V6a4 4 0 0 1 4-4Z" />
            {/* Crossed Bats Overlay - Simplified */}
            <path d="m15.5 8.5 3 3" />
            <path d="m8.5 8.5-3 3" />
        </svg>
    )
}
// Actually, user asked for "two tabletennis bats crossing eachother"
// The above lucid icon style "Trophy" or similar was used.
// Let's make a custom SVG that looks like crossed bats.
export function CrossedBatsLogo({ className }: LogoProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("w-8 h-8", className)}
        >
            {/* Left Bat */}
            <path d="M7 11.5a4.5 4.5 0 1 1 5-7.5 4.5 4.5 0 0 1-5 7.5Z" transform="rotate(-45 9.5 7.75)" />
            <line x1="7.5" y1="13.5" x2="5" y2="16" />

            {/* Right Bat */}
            <path d="M13 11.5a4.5 4.5 0 1 1 5-7.5 4.5 4.5 0 0 1-5 7.5Z" transform="rotate(45 15.5 7.75)" />
            <line x1="16.5" y1="13.5" x2="19" y2="16" />
        </svg>
    );
}
// Wait, that SVG math is hard to get right blindly.
// Let's stick to a simpler crossed lines + ellipsis representation or reuse lucide icons combined.
