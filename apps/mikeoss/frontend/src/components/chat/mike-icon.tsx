"use client";

import React, { useId } from "react";

type IconPalette = {
    shadow: string;
    primary: string;
    secondary: string;
    accent: string;
    stroke: string;
};

const DEFAULT_PALETTE: IconPalette = {
    shadow: "#0f172a",
    primary: "#111827",
    secondary: "#475569",
    accent: "#d8b25c",
    stroke: "#f8fafc",
};

const DONE_PALETTE: IconPalette = {
    shadow: "#166534",
    primary: "#15803d",
    secondary: "#22c55e",
    accent: "#bbf7d0",
    stroke: "#f0fdf4",
};

const ERROR_PALETTE: IconPalette = {
    shadow: "#991b1b",
    primary: "#b91c1c",
    secondary: "#ef4444",
    accent: "#fecaca",
    stroke: "#fef2f2",
};

export function MikeIcon({
    spin = false,
    done = false,
    error = false,
    mike = false,
    size = 24,
    style,
}: {
    spin?: boolean;
    done?: boolean;
    error?: boolean;
    mike?: boolean;
    size?: number;
    style?: React.CSSProperties;
}) {
    void mike;
    const id = useId().replace(/:/g, "");
    const palette = error
        ? ERROR_PALETTE
        : done
          ? DONE_PALETTE
          : DEFAULT_PALETTE;
    const gradientId = `${id}-cb-gradient`;
    const glowId = `${id}-cb-glow`;

    return (
        <span
            className="shrink-0 inline-block animate-[spin_3s_linear_infinite]"
            style={{
                animationPlayState: spin ? "running" : "paused",
                ...style,
            }}
            aria-hidden="true"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 64 64"
                width={size}
                height={size}
                style={{ display: "block" }}
            >
                <defs>
                    <linearGradient
                        id={gradientId}
                        x1="10"
                        y1="8"
                        x2="54"
                        y2="58"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop offset="0" stopColor={palette.secondary} />
                        <stop offset="0.55" stopColor={palette.primary} />
                        <stop offset="1" stopColor={palette.accent} />
                    </linearGradient>
                    <filter
                        id={glowId}
                        x="-30%"
                        y="-30%"
                        width="160%"
                        height="160%"
                    >
                        <feDropShadow
                            dx="0"
                            dy="2"
                            stdDeviation="2.4"
                            floodColor={palette.shadow}
                            floodOpacity="0.22"
                        />
                    </filter>
                </defs>
                <rect
                    x="10"
                    y="10"
                    width="44"
                    height="44"
                    rx="12"
                    fill={`url(#${gradientId})`}
                    filter={`url(#${glowId})`}
                />
                <path
                    d="M18 38c7-9 21-9 28 0"
                    fill="none"
                    stroke={palette.stroke}
                    strokeWidth="4"
                    strokeLinecap="round"
                />
                <path
                    d="M22 32c5-6 15-6 20 0"
                    fill="none"
                    stroke={palette.accent}
                    strokeWidth="3"
                    strokeLinecap="round"
                />
                <path
                    d="M21 43h22"
                    fill="none"
                    stroke={palette.stroke}
                    strokeWidth="4"
                    strokeLinecap="round"
                />
                <circle cx="32" cy="24" r="4" fill={palette.stroke} />
            </svg>
        </span>
    );
}
