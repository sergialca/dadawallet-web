import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { verifyPrivyAccessToken } from "@/lib/privy-server";
import { safeRedirectPath } from "@/lib/safe-redirect";

const PUBLIC_AUTH_PATHS = new Set(["/login", "/signup"]);
const REFRESH_PATH = "/refresh";

function isProtectedPath(pathname: string) {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

function hasOauthParams(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  return Boolean(
    params.get("privy_oauth_code") ||
      params.get("privy_oauth_state") ||
      params.get("privy_oauth_provider"),
  );
}

async function hasValidAccessToken(request: NextRequest) {
  const token = request.cookies.get("privy-token")?.value;
  if (!token) {
    return false;
  }

  return verifyPrivyAccessToken(token);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (hasOauthParams(request) || pathname === REFRESH_PATH || pathname === "/mcp") {
    return NextResponse.next();
  }

  const authenticated = await hasValidAccessToken(request);
  const maybeAuthenticated = Boolean(request.cookies.get("privy-session")?.value);

  if (isProtectedPath(pathname)) {
    if (authenticated) {
      return NextResponse.next();
    }

    if (maybeAuthenticated) {
      const refreshUrl = new URL(REFRESH_PATH, request.url);
      refreshUrl.searchParams.set("redirect_url", safeRedirectPath(pathname));
      return NextResponse.redirect(refreshUrl);
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/" || PUBLIC_AUTH_PATHS.has(pathname)) {
    if (authenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
