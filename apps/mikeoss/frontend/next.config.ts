import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

function originFromUrl(value: string | undefined): string | null {
    if (!value) return null;
    try {
        return new URL(value).origin;
    } catch {
        return null;
    }
}

function supabaseWsOrigin(value: string | undefined): string | null {
    const origin = originFromUrl(value);
    if (!origin) return null;
    return origin.replace(/^https:/, "wss:").replace(/^http:/, "ws:");
}

const productionConnectSrc = [
    originFromUrl(process.env.NEXT_PUBLIC_API_BASE_URL),
    originFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseWsOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL),
].filter(Boolean) as string[];

if (isProduction && productionConnectSrc.length === 0) {
    throw new Error(
        "Production CSP connect-src requires NEXT_PUBLIC_API_BASE_URL or NEXT_PUBLIC_SUPABASE_URL",
    );
}

const connectSrc = [
    "'self'",
    ...(isProduction
        ? productionConnectSrc
        : [
              "http://localhost:3001",
              "http://127.0.0.1:*",
              "ws://localhost:*",
              "ws://127.0.0.1:*",
          ]),
].join(" ");

const nextConfig: NextConfig = {
    /* config options here */
    reactCompiler: true,
    async rewrites() {
        return [
            {
                source: "/sitemap.xml",
                destination: "/api/sitemap/sitemap.xml",
            },
            {
                source: "/sitemap_:slug.xml",
                destination: "/api/sitemap/sitemap_:slug.xml",
            },
        ];
    },
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "Content-Security-Policy",
                        value: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src ${connectSrc}; object-src 'none'; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`,
                    },
                    { key: "Referrer-Policy", value: "no-referrer" },
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "X-Frame-Options", value: "DENY" },
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=(), fullscreen=()",
                    },
                    ...(isProduction
                        ? [
                              {
                                  key: "Strict-Transport-Security",
                                  value: "max-age=15552000; includeSubDomains",
                              },
                          ]
                        : []),
                ],
            },
        ];
    },
    skipTrailingSlashRedirect: true,
};

export default nextConfig;
