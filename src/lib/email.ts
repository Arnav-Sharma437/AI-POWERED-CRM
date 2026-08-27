import * as nodemailer from "nodemailer";

export async function sendOtpEmail(email: string, code: string): Promise<boolean> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM || "no-reply@bda-crm.com";

  const messageText = `
AI POWERED BDA CRM Verification Code

Your 6-digit email verification code is: ${code}

This code will expire in 10 minutes. 

Security Notice: If you did not request this login code, please change your password immediately.
`;

  const messageHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 500px;">
      <h2 style="color: #2563eb; margin-bottom: 20px;">AI POWERED BDA CRM</h2>
      <p>Your 6-digit email verification code is:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 15px; background-color: #f3f4f6; text-align: center; border-radius: 6px; margin: 20px 0; color: #1f2937;">
        ${code}
      </div>
      <p style="color: #4b5563; font-size: 14px;">This code is valid for <strong>10 minutes</strong> and is for one-time use only.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #ef4444; font-size: 12px; line-height: 1.4;">
        <strong>Security Notice:</strong> If you did not request this verification code, please ignore this email and change your CRM login credentials immediately.
      </p>
    </div>
  `;

  // Fallback to console print if SMTP is not configured
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log("\n==================================================");
    console.log(`[OTP EMAIL DISPATCH MOCK]`);
    console.log(`To: ${email}`);
    console.log(`Verification Code: ${code}`);
    console.log(`Expiry: 10 minutes`);
    console.log("==================================================\n");
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort || "587", 10),
      secure: smtpPort === "465",
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    await transporter.sendMail({
      from: smtpFrom,
      to: email,
      subject: `[AI POWERED BDA CRM] Your Verification Code: ${code}`,
      text: messageText,
      html: messageHtml
    });

    return true;
  } catch (error) {
    console.error("Failed to send SMTP email:", error);
    // In dev, still print code to console as absolute fallback so developer is never blocked
    console.log("\n==================================================");
    console.log(`[OTP EMAIL DISPATCH FALLBACK]`);
    console.log(`To: ${email}`);
    console.log(`Verification Code: ${code}`);
    console.log("==================================================\n");
    return true;
  }
}
