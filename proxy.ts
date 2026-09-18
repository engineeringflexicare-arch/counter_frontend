import {
  NextRequest,
  NextResponse,
} from "next/server";

interface UserPayload {
  role?: string;
}

export function proxy(
  request: NextRequest
) {
  const { pathname } =
    request.nextUrl;

  const token =
    request.cookies.get("token")?.value;

  const userCookie =
    request.cookies.get("user")?.value;

  // ==========================================
  // PUBLIC ROUTES
  // ==========================================
  const publicRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ];

  const isPublicRoute =
    publicRoutes.some((route) =>
      pathname.startsWith(route)
    );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // ==========================================
  // AUTH CHECK
  // ==========================================
  if (!token) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  // ==========================================
  // USER COOKIE
  // ==========================================
  let user: UserPayload | null =
    null;

  try {
    if (userCookie) {
      user = JSON.parse(
        decodeURIComponent(userCookie)
      ) as UserPayload;
    }
  } catch {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  const role =
    user?.role?.toLowerCase();

  // ==========================================
  // ASSEMBLY SUPERVISOR
  // ==========================================
  if (
    pathname.startsWith(
      "/AssemblySupervisor"
    )
  ) {
    if (
      role !==
      "assembly_supervisor"
    ) {
      return NextResponse.redirect(
        new URL("/login", request.url)
      );
    }
  }

  // ==========================================
  // PRODUCTION SUPERVISOR
  // ==========================================
  if (
    pathname.startsWith(
      "/ProductionSupervisor"
    )
  ) {
    if (
      role !==
      "production_supervisor"
    ) {
      return NextResponse.redirect(
        new URL("/login", request.url)
      );
    }
  }

  // ==========================================
  // ADMIN
  // ==========================================
  if (
    pathname.startsWith("/Admin")
  ) {
    if (role !== "admin") {
      return NextResponse.redirect(
        new URL("/login", request.url)
      );
    }
  }

  // ==========================================
  // SUPERUSER
  // ==========================================
  if (
    pathname.startsWith("/Superuser")
  ) {
    if (role !== "superuser") {
      return NextResponse.redirect(
        new URL("/login", request.url)
      );
    }
  }

  // ==========================================
  // AUTHORIZED
  // ==========================================
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|manifest|icon-192\\.png|icon-512\\.png|logo\\.png|logo\\.svg|default\\.png|Background\\.png|offline\\.html|window\\.svg|globe\\.svg|file\\.svg|vercel\\.svg|icons8-user-default-96\\.png).*)",
  ],
};