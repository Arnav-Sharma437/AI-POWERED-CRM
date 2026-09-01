import { NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth";
import { listUsers, getUserById } from "@/lib/services";
import { sendTeamMemberWelcomeEmail } from "@/lib/email";
import * as bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = await listUsers();
    // Exclude soft-deleted users from BDA dropdown and regular lists
    const activeUsers = users.filter((u: any) => !u.isTrashed);
    return NextResponse.json({ success: true, users: activeUsers });
  } catch (error) {
    console.error("Users API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookiesHeader = request.headers.get("cookie") || "";
    const token = cookiesHeader.split(";").find(c => c.trim().startsWith("token="))?.split("=")[1];
    const currentUserDecoded = token ? await verifyJWT(token) : null;
    if (!currentUserDecoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentBdaUser = await getUserById(currentUserDecoded.userId);
    // Find current user's role
    const allUsers = await listUsers();
    const currentUserRole = allUsers.find(u => u.id === currentUserDecoded.userId)?.roleName;

    const body = await request.json();
    const { name, email, password, roleName, isActive } = body;

    if (!name || !email || !password || !roleName) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Role restrictions: Only Super Admin can create/add team members
    if (currentUserRole !== "Super Admin") {
      return NextResponse.json({ error: "Only Super Admin users can add team members" }, { status: 403 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate
    const existingUser = allUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (existingUser) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const { prisma } = await import("@/lib/db");
    
    // Find roleId by name
    let role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      // Create role if not found
      role = await prisma.role.create({
        data: {
          name: roleName,
          permissions: roleName === "BDA" ? ["leads", "clients", "projects"] : ["basic"]
        }
      });
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email: cleanEmail,
        passwordHash,
        roleId: role.id,
        isActive: isActive !== false
      },
      include: {
        role: true
      }
    });

    // Send onboarding welcome email with login details and task notification
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const loginUrl = `${protocol}://${host}/login`;

    try {
      await sendTeamMemberWelcomeEmail({
        name: newUser.name,
        email: newUser.email,
        roleName: newUser.role.name,
        password,
        loginUrl
      });
    } catch (emailErr) {
      console.error("Failed to send welcome email to new team member:", emailErr);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        roleName: newUser.role.name,
        isActive: newUser.isActive
      }
    });

  } catch (error: any) {
    console.error("Users POST error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
