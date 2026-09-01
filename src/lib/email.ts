import * as nodemailer from "nodemailer";

function getTransporter() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASSWORD;

  if (!smtpHost || !smtpUser || !smtpPass) {
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort || "587", 10),
    secure: smtpPort === "465",
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });
}

export async function sendOtpEmail(email: string, code: string): Promise<boolean> {
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

  const transporter = getTransporter();
  if (!transporter) {
    console.log("\n==================================================");
    console.log(`[OTP EMAIL DISPATCH MOCK]`);
    console.log(`To: ${email}`);
    console.log(`Verification Code: ${code}`);
    console.log(`Expiry: 10 minutes`);
    console.log("==================================================\n");
    return true;
  }

  try {
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
    console.log("\n==================================================");
    console.log(`[OTP EMAIL DISPATCH FALLBACK]`);
    console.log(`To: ${email}`);
    console.log(`Verification Code: ${code}`);
    console.log("==================================================\n");
    return true;
  }
}

export interface TeamMemberWelcomeParams {
  name: string;
  email: string;
  roleName: string;
  password?: string;
  loginUrl?: string;
}

export async function sendTeamMemberWelcomeEmail(params: TeamMemberWelcomeParams): Promise<boolean> {
  const { name, email, roleName, password, loginUrl } = params;
  const smtpFrom = process.env.SMTP_FROM || "no-reply@bda-crm.com";
  const effectiveLoginUrl = loginUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000/login";

  const messageText = `
Welcome to AI POWERED BDA CRM!

Hello ${name},

You have been added to the AI POWERED BDA CRM as a ${roleName}.

Your Account Details:
- Email: ${email}
${password ? `- Temporary Password: ${password}` : ""}
- Role: ${roleName}
- Login URL: ${effectiveLoginUrl}

Please login to your account and review your assigned leads, projects, and tasks:
${effectiveLoginUrl}

Important:
- When you login, you will receive a secure OTP code on this email address to verify your session.
- Once logged in, you can view all tasks, projects, calendar meetings, and team chat messages assigned to you.

Best regards,
BDA CRM Team
`;

  const messageHtml = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; border: 1px solid #e5e7eb; border-radius: 12px; max-width: 550px; background-color: #ffffff; color: #1f2937;">
      <div style="border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px;">
        <h2 style="color: #2563eb; margin: 0; font-size: 22px;">AI POWERED BDA CRM</h2>
        <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0 0;">Team Onboarding & Task Assignment Notification</p>
      </div>

      <p style="font-size: 16px; font-weight: 600; margin-bottom: 10px;">Hello ${name},</p>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        You have been added to the <strong>AI POWERED BDA CRM</strong> team as a <strong>${roleName}</strong>. Your account has been created and your tasks & workspace are ready.
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h3 style="font-size: 14px; font-weight: 700; color: #1e293b; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">Your Login Credentials</h3>
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; width: 140px;"><strong>Email:</strong></td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${email}</td>
          </tr>
          ${
            password
              ? `<tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Password:</strong></td>
            <td style="padding: 6px 0; color: #0f172a; font-family: monospace; font-size: 15px; font-weight: bold; background-color: #e2e8f0; padding: 2px 6px; border-radius: 4px; display: inline-block;">${password}</td>
          </tr>`
              : ""
          }
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Assigned Role:</strong></td>
            <td style="padding: 6px 0; color: #2563eb; font-weight: 600;">${roleName}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 25px 0;">
        <a href="${effectiveLoginUrl}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
          Login to CRM Dashboard
        </a>
      </div>

      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 14px; border-radius: 4px; margin-bottom: 20px;">
        <p style="font-size: 13px; color: #1e40af; margin: 0; line-height: 1.5;">
          <strong>What's Next?</strong><br/>
          • Login to access your dashboard and tasks.<br/>
          • You will receive a 6-digit email OTP verification code upon login for security.<br/>
          • Check your active leads, assigned projects, calendar schedules, and internal team chats.
        </p>
      </div>

      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
        This is an automated notification from AI POWERED BDA CRM.
      </p>
    </div>
  `;

  const transporter = getTransporter();
  if (!transporter) {
    console.log("\n==================================================");
    console.log(`[TEAM MEMBER WELCOME EMAIL DISPATCH MOCK]`);
    console.log(`To: ${email}`);
    console.log(`Name: ${name}`);
    console.log(`Role: ${roleName}`);
    console.log(`Login URL: ${effectiveLoginUrl}`);
    console.log("==================================================\n");
    return true;
  }

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to: email,
      subject: `[AI POWERED BDA CRM] Welcome ${name}! Login & Task Assignment Details`,
      text: messageText,
      html: messageHtml
    });
    return true;
  } catch (error) {
    console.error("Failed to send Team Member Welcome Email via SMTP:", error);
    console.log("\n==================================================");
    console.log(`[TEAM MEMBER WELCOME EMAIL FALLBACK]`);
    console.log(`To: ${email}`);
    console.log(`Name: ${name}`);
    console.log(`Role: ${roleName}`);
    console.log(`Login URL: ${effectiveLoginUrl}`);
    console.log("==================================================\n");
    return true;
  }
}

export interface TaskAssignmentEmailParams {
  devName: string;
  devEmail: string;
  projectName: string;
  clientName?: string;
  serviceType?: string;
  deadline?: string;
  workDetails: string;
  projectUrl?: string;
}

export async function sendTaskAssignmentRealEmail(params: TaskAssignmentEmailParams): Promise<boolean> {
  const { devName, devEmail, projectName, clientName, serviceType, deadline, workDetails, projectUrl } = params;
  const smtpFrom = process.env.SMTP_FROM || "no-reply@bda-crm.com";
  const effectiveProjectUrl = projectUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000/dashboard/projects";

  const messageText = `
New Task / Project Assigned: ${projectName}

Hello ${devName},

You have been assigned a new task on project: ${projectName}.

Project Details:
- Project Name: ${projectName}
${serviceType ? `- Service Type: ${serviceType}` : ""}
${clientName ? `- Client: ${clientName}` : ""}
${deadline ? `- Target Deadline: ${deadline}` : ""}

Task Requirements & Notes:
${workDetails}

View Project & Task Workspace:
${effectiveProjectUrl}

Note: Budget and financial details are confidential and hidden from developer view.

Best regards,
AI POWERED BDA CRM
`;

  const messageHtml = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; border: 1px solid #e5e7eb; border-radius: 12px; max-width: 580px; background-color: #ffffff; color: #1f2937;">
      <div style="border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px;">
        <h2 style="color: #2563eb; margin: 0; font-size: 22px;">AI POWERED BDA CRM</h2>
        <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0 0;">New Task & Project Assignment</p>
      </div>

      <p style="font-size: 16px; font-weight: 600; margin-bottom: 10px;">Hello ${devName},</p>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        A new task has been assigned to you for the project <strong>${projectName}</strong>. Please review the requirement details below:
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h3 style="font-size: 14px; font-weight: 700; color: #1e293b; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">Project Summary</h3>
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; width: 140px;"><strong>Project:</strong></td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${projectName}</td>
          </tr>
          ${serviceType ? `<tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Service Type:</strong></td>
            <td style="padding: 6px 0; color: #2563eb; font-weight: 600;">${serviceType}</td>
          </tr>` : ""}
          ${clientName ? `<tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Client:</strong></td>
            <td style="padding: 6px 0; color: #0f172a;">${clientName}</td>
          </tr>` : ""}
          ${deadline ? `<tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Target Deadline:</strong></td>
            <td style="padding: 6px 0; color: #ef4444; font-weight: 600;">${deadline}</td>
          </tr>` : ""}
        </table>
      </div>

      <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h4 style="font-size: 13px; font-weight: 700; color: #334155; margin: 0 0 8px 0; text-transform: uppercase;">Task Requirements & Deliverables</h4>
        <div style="font-size: 14px; line-height: 1.6; color: #1e293b; white-space: pre-wrap; background-color: #f1f5f9; padding: 12px; border-radius: 6px;">${workDetails}</div>
      </div>

      <div style="text-align: center; margin: 25px 0;">
        <a href="${effectiveProjectUrl}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
          Open Project & Team Chat
        </a>
      </div>

      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
        Confidential Notice: Financials and budget details are kept private and managed by project BDAs.
      </p>
    </div>
  `;

  const transporter = getTransporter();
  if (!transporter) {
    console.log("\n==================================================");
    console.log(`[TASK ASSIGNMENT EMAIL DISPATCH MOCK]`);
    console.log(`To: ${devEmail}`);
    console.log(`Developer: ${devName}`);
    console.log(`Project: ${projectName}`);
    console.log(`Requirements: ${workDetails}`);
    console.log("==================================================\n");
    return true;
  }

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to: devEmail,
      subject: `[AI POWERED CRM] New Task Assigned: ${projectName}`,
      text: messageText,
      html: messageHtml
    });
    return true;
  } catch (error) {
    console.error("Failed to send Task Assignment Email via SMTP:", error);
    console.log("\n==================================================");
    console.log(`[TASK ASSIGNMENT EMAIL FALLBACK]`);
    console.log(`To: ${devEmail}`);
    console.log(`Developer: ${devName}`);
    console.log(`Project: ${projectName}`);
    console.log(`Requirements: ${workDetails}`);
    console.log("==================================================\n");
    return true;
  }
}

export async function sendMeetingScheduleEmail({
  attendeeEmail,
  attendeeName,
  organizerName,
  meetingTitle,
  meetingType,
  startTime,
  notes,
  meetLink
}: {
  attendeeEmail: string;
  attendeeName: string;
  organizerName: string;
  meetingTitle: string;
  meetingType: string;
  startTime: string;
  notes?: string;
  meetLink?: string;
}): Promise<boolean> {
  const smtpFrom = process.env.SMTP_FROM || "no-reply@bda-crm.com";
  const dateFormatted = new Date(startTime).toLocaleString([], { dateStyle: "full", timeStyle: "short" });

  const messageText = `
AI POWERED CRM - Meeting Invitation

Hello ${attendeeName},

You have been scheduled for a ${meetingType} by ${organizerName}.

Topic: ${meetingTitle}
Date & Time: ${dateFormatted}
${meetLink ? `Meeting Link: ${meetLink}` : ""}
${notes ? `Notes / Agenda: ${notes}` : ""}

Please open your CRM dashboard calendar to view the schedule.
`;

  const messageHtml = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; border: 1px solid #e5e7eb; border-radius: 12px; max-width: 580px; background-color: #ffffff; color: #1f2937;">
      <div style="border-bottom: 2px solid #6366f1; padding-bottom: 15px; margin-bottom: 20px;">
        <h2 style="color: #6366f1; margin: 0; font-size: 22px;">NEXUS AI CRM</h2>
        <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0 0;">New Meeting / Discussion Scheduled</p>
      </div>

      <p style="font-size: 16px; font-weight: 600; margin-bottom: 10px;">Hello ${attendeeName},</p>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        <strong>${organizerName}</strong> has scheduled a new <strong>${meetingType}</strong> with you.
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; width: 130px;"><strong>Topic:</strong></td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${meetingTitle}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Date & Time:</strong></td>
            <td style="padding: 6px 0; color: #6366f1; font-weight: 600;">${dateFormatted}</td>
          </tr>
          ${notes ? `<tr>
            <td style="padding: 6px 0; color: #64748b; vertical-align: top;"><strong>Agenda / Notes:</strong></td>
            <td style="padding: 6px 0; color: #334155; white-space: pre-wrap;">${notes}</td>
          </tr>` : ""}
        </table>
      </div>

      ${meetLink ? `
      <div style="text-align: center; margin: 25px 0;">
        <a href="${meetLink}" target="_blank" style="background-color: #6366f1; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.25);">
          Join Google Meet / Call ↗
        </a>
      </div>
      ` : ""}

      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
        This meeting is linked to your CRM calendar schedule.
      </p>
    </div>
  `;

  const transporter = getTransporter();
  if (!transporter) {
    console.log("\n==================================================");
    console.log(`[MEETING SCHEDULE EMAIL MOCK]`);
    console.log(`To: ${attendeeEmail}`);
    console.log(`Attendee: ${attendeeName}`);
    console.log(`Meeting: ${meetingTitle}`);
    console.log(`Time: ${dateFormatted}`);
    if (meetLink) console.log(`Link: ${meetLink}`);
    console.log("==================================================\n");
    return true;
  }

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to: attendeeEmail,
      subject: `[AI POWERED CRM] Meeting Scheduled: ${meetingTitle}`,
      text: messageText,
      html: messageHtml
    });
    return true;
  } catch (error) {
    console.error("Failed to send Meeting Schedule Email via SMTP:", error);
    return true;
  }
}
