import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await verifySession(request);
    if (session) {
      const { createActivity } = await import("@/lib/services");
      await createActivity({
        type: "System",
        notes: `User logged out (Session ended from ${session.workLocation || "Workplace"})`,
        userId: session.userId
      }).catch((e: any) => console.error("Error logging logout activity:", e));
    }
  } catch (err: any) {
    console.error("Logout activity log error:", err);
  }

  const response = NextResponse.json({ success: true });
  
  // Clear the token cookie by setting maxAge to 0
  response.cookies.set({
    name: "token",
    value: "",
    httpOnly: true,
    path: "/",
    expires: new Date(0),
    maxAge: 0
  });

  // Clear temp_token cookie
  response.cookies.set({
    name: "temp_token",
    value: "",
    httpOnly: true,
    path: "/",
    expires: new Date(0),
    maxAge: 0
  });

  return response;
}
