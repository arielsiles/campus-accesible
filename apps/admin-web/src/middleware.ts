// FR-504: Next.js middleware for Basic Auth
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;

  // Skip auth if credentials not configured (dev mode)
  if (!expectedUser || !expectedPass) {
    return NextResponse.next();
  }

  if (!authHeader) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Admin Panel"' },
    });
  }

  const match = authHeader.match(/^Basic\s+(.+)$/);
  if (!match) {
    return new NextResponse("Invalid authentication", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Admin Panel"' },
    });
  }

  try {
    const decoded = atob(match[1]);
    const [user, pass] = decoded.split(":");

    if (user === expectedUser && pass === expectedPass) {
      return NextResponse.next();
    }
  } catch {
    // Invalid base64
  }

  return new NextResponse("Invalid credentials", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin Panel"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
