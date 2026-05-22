import type { Metadata } from "next";
import { Inter, EB_Garamond } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://github.com/PrivateCounsel/CounselBridge";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

const ebGaramond = EB_Garamond({
    variable: "--font-eb-garamond",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: "CounselBridge",
    description:
        "CounselBridge connects a modified MikeOSS workspace to Claude Legal-style workflows.",
    icons: {
        icon: [
            { url: "/icon.svg", type: "image/svg+xml" },
            { url: "/favicon.ico" },
        ],
        apple: "/apple-touch-icon.png",
    },
    openGraph: {
        type: "website",
        url: siteUrl,
        siteName: "CounselBridge",
        title: "CounselBridge",
        description:
            "CounselBridge connects a modified MikeOSS workspace to Claude Legal-style workflows.",
        images: [
            {
                url: "/link-image.jpg",
                width: 1200,
                height: 651,
                alt: "CounselBridge",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "CounselBridge",
        description:
            "CounselBridge connects a modified MikeOSS workspace to Claude Legal-style workflows.",
        images: ["/link-image.jpg"],
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${inter.variable} ${ebGaramond.variable} font-sans antialiased`}
            >
                <Providers>{children}</Providers>
                <div className="fixed bottom-2 left-4 z-[200] max-w-[calc(100vw-2rem)] text-[11px] leading-snug text-gray-400">
                    Copyright 2026 Private Counsel. Licensed AGPL-3.0-only.
                    No warranty.{" "}
                    <a
                        href="https://github.com/PrivateCounsel/CounselBridge"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 hover:text-gray-700"
                    >
                        Corresponding Source
                    </a>
                </div>
            </body>
        </html>
    );
}
