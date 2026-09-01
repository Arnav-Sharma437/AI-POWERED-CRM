import { NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth";
import { getUserById, listUsers } from "@/lib/services";
import * as bcrypt from "bcryptjs";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookiesHeader = request.headers.get("cookie") || "";
    const token = cookiesHeader.split(";").find(c => c.trim().startsWith("token="))?.split("=")[1];
    const currentUserDecoded = token ? await verifyJWT(token) : null;
    if (!currentUserDecoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allUsers = await listUsers();
    const currentUserRole = allUsers.find(u => u.id === currentUserDecoded.userId)?.roleName;
    const userToEdit = allUsers.find(u => u.id === id);

    if (!userToEdit) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, email, roleName, isActive, password } = body;

    // Validation: Only Super Admin can modify team members (or a user editing their own profile name/password)
    const isSelf = currentUserDecoded.userId === id;
    if (currentUserRole !== "Super Admin" && !isSelf) {
      return NextResponse.json({ error: "Only Super Admin users can modify team members" }, { status: 403 });
    }

    if (!isSelf && roleName === "Super Admin" && currentUserRole !== "Super Admin") {
      return NextResponse.json({ error: "Unauthorized. Only Super Admin users can modify Super Admin accounts" }, { status: 403 });
    }

    const { prisma } = await import("@/lib/db");
    const updateData: any = {};

    if (name) updateData.name = name;
    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      // Ensure email uniqueness
      const duplicate = allUsers.find(u => u.email.toLowerCase() === cleanEmail && u.id !== id);
      if (duplicate) {
        return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 });
      }
      updateData.email = cleanEmail;
    }

    if (roleName) {
      const role = await prisma.role.findUnique({ where: { name: roleName } });
      if (!role) return NextResponse.json({ error: "Selected role does not exist" }, { status: 400 });
      updateData.roleId = role.id;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    if (password && password.trim().length >= 6) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: true }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        roleName: updatedUser.role.name,
        isActive: updatedUser.isActive
      }
    });

  } catch (error: any) {
    console.error("User PUT error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookiesHeader = request.headers.get("cookie") || "";
    const token = cookiesHeader.split(";").find(c => c.trim().startsWith("token="))?.split("=")[1];
    const currentUserDecoded = token ? await verifyJWT(token) : null;
    if (!currentUserDecoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allUsers = await listUsers();
    const currentUserRole = allUsers.find(u => u.id === currentUserDecoded.userId)?.roleName;
    const userToDelete = allUsers.find(u => u.id === id);

    if (!userToDelete) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Role checks: Only Super Admin can delete/soft-delete team members
    if (currentUserRole !== "Super Admin") {
      return NextResponse.json({ error: "Only Super Admin users can delete team members" }, { status: 403 });
    }

    const { prisma } = await import("@/lib/db");
    
    // Soft delete by setting isTrashed = true
    await prisma.user.update({
      where: { id },
      data: { isTrashed: true }
    });

    return NextResponse.json({ success: true, message: "User soft-deleted successfully" });

  } catch (error: any) {
    console.error("User DELETE error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
