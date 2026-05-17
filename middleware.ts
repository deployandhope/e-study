import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected) {
    return new NextResponse("DASHBOARD_PASSWORD niet geconfigureerd", { status: 500 });
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const decoded = atob(authHeader.slice(6));
    const password = decoded.includes(":")
      ? decoded.slice(decoded.indexOf(":") + 1)
      : decoded;
    if (password === expected) return NextResponse.next();
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="eStudy Dashboard"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.png|.*\\.svg).*)"],
};
