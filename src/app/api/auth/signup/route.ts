import { NextResponse } from "next/server";
import { registerUser } from "@/lib/services";

export async function POST(request: Request) {
  try {
    const { name, email, password, confirmPassword } = await request.json();

    // 1. Basic validation
    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // 2. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // 3. Password length validation
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // 4. Passwords match validation
    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }

    // 5. Register User
    const user = await registerUser(name, email, password);

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roleId: user.roleId
      }
    });

  } catch (error: any) {
    console.error("Signup error:", error);
    const msg = error.message || "Something went wrong. Please try again.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
