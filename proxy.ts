import { NextRequest, NextResponse } from "next/server";


export function proxy(request: NextRequest) {

  const { pathname } = request.nextUrl;


  const token = request.cookies.get("token")?.value;
  const userCookie = request.cookies.get("user")?.value;


  const publicRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ];


  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );


  if (isPublicRoute) {
    return NextResponse.next();
  }


  if (!token) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }


  interface UserPayload {
    role?: string;
  }

  let user: UserPayload | null = null;

  try {
    if (userCookie) {
      user = JSON.parse(decodeURIComponent(userCookie)) as UserPayload;
    }
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }



  // Assembly Supervisor
  if(pathname.startsWith("/AssemblySupervisor")){

    if(user?.role !== "assembly_supervisor"){

      return NextResponse.redirect(
        new URL("/login", request.url)
      );

    }

  }



  // Production Supervisor
  if(pathname.startsWith("/ProductionSupervisor")){

    if(user?.role !== "production_supervisor"){

      return NextResponse.redirect(
        new URL("/login", request.url)
      );

    }

  }



  // Admin
  if(pathname.startsWith("/Admin")){

    if(user?.role !== "admin"){

      return NextResponse.redirect(
        new URL("/login", request.url)
      );

    }

  }



  // Superuser
  if(pathname.startsWith("/Superuser")){

    if(user?.role !== "superuser"){

      return NextResponse.redirect(
        new URL("/login", request.url)
      );

    }

  }



  return NextResponse.next();

}



export const config = {

 matcher:[
   "/((?!_next/static|_next/image|favicon.ico).*)",
 ]

};