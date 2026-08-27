import { prisma } from "./db";
import { sendOtpEmail } from "./email";
import * as crypto from "crypto";

export function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function createVerificationSession(userId: string): Promise<{ verificationId: string; code: string; error?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user || user.isTrashed || !user.isActive) {
      return { verificationId: "", code: "", error: "User not found or inactive." };
    }

    // 1. Invalidate any existing active verifications for this user
    await prisma.emailVerification.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() } // Mark as invalidated/used
    });

    // 2. Generate a secure 6-digit code
    const code = Math.floor(100000 + crypto.randomInt(900000)).toString();
    const codeHash = hashOtp(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 3. Save to DB
    const verification = await prisma.emailVerification.create({
      data: {
        userId,
        codeHash,
        expiresAt,
        attempts: 0
      }
    });

    // 4. Send email
    await sendOtpEmail(user.email, code);

    return { verificationId: verification.id, code };
  } catch (err: any) {
    console.error("createVerificationSession error:", err);
    return { verificationId: "", code: "", error: err.message || "Failed to create verification session." };
  }
}

export async function verifyOtpCode(verificationId: string, code: string): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    const verification = await prisma.emailVerification.findUnique({
      where: { id: verificationId }
    });

    if (!verification) {
      return { success: false, error: "Verification session not found." };
    }

    if (verification.usedAt) {
      return { success: false, error: "Verification code has already been used or invalidated." };
    }

    if (new Date() > verification.expiresAt) {
      return { success: false, error: "Verification code has expired." };
    }

    if (verification.attempts >= 3) {
      return { success: false, error: "Too many failed attempts. Please request a new verification code." };
    }

    const inputHash = hashOtp(code.trim());
    if (inputHash === verification.codeHash) {
      // Mark as used
      await prisma.emailVerification.update({
        where: { id: verificationId },
        data: { usedAt: new Date() }
      });
      return { success: true, userId: verification.userId };
    } else {
      // Increment attempts
      const updated = await prisma.emailVerification.update({
        where: { id: verificationId },
        data: { attempts: { increment: 1 } }
      });
      
      if (updated.attempts >= 3) {
        return { success: false, error: "Too many failed attempts. Verification session has been locked." };
      }
      
      const remaining = 3 - updated.attempts;
      return { success: false, error: `Incorrect verification code. ${remaining} attempts remaining.` };
    }
  } catch (err: any) {
    console.error("verifyOtpCode error:", err);
    return { success: false, error: err.message || "Verification failed." };
  }
}
