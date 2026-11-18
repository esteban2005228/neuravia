import { NextResponse, type NextRequest } from "next/server";

/** Legacy path: forwards to /auth/callback, which handles token_hash and code links. */
export function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/auth/callback";
  if (!url.searchParams.get("next")) url.searchParams.set("next", "/onboarding");
  return NextResponse.redirect(url);
}
