import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedPath = /^\/(assistant|projects|workflows|tabular-reviews|account)(\/|$)/;

export async function middleware(request: NextRequest) {
    if (!protectedPath.test(request.nextUrl.pathname)) {
        return NextResponse.next();
    }

    let response = NextResponse.next({ request });
    const supabaseUrl =
        process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const anonKey =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || "";

    if (!supabaseUrl || !anonKey) {
        return new NextResponse("Supabase environment is not configured", {
            status: 500,
        });
    }

    const supabase = createServerClient(supabaseUrl, anonKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => {
                    request.cookies.set(name, value);
                });
                response = NextResponse.next({ request });
                cookiesToSet.forEach(({ name, value, options }) => {
                    response.cookies.set(name, value, {
                        ...options,
                        sameSite: options?.sameSite ?? "lax",
                        secure: true,
                    });
                });
            },
        },
    });

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.searchParams.set("next", request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    return response;
}

export const config = {
    matcher: [
        "/assistant/:path*",
        "/projects/:path*",
        "/workflows/:path*",
        "/tabular-reviews/:path*",
        "/account/:path*",
    ],
};
