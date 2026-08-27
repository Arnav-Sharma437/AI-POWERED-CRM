import { NextResponse } from "next/server";

export async function POST() {
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
