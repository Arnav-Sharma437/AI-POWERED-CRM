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

export interface UserLoginAlertEmailParams {
  adminEmail: string;
  adminName?: string;
  userName: string;
  userEmail: string;
  userRole: string;
  workLocation: string; // "Office" | "Home" | "Remote"
  loginTime: Date;
  ipAddress?: string;
}

export async function sendUserLoginAlertEmail(params: UserLoginAlertEmailParams): Promise<boolean> {
  const { adminEmail, adminName, userName, userEmail, userRole, workLocation, loginTime, ipAddress } = params;
  const smtpFrom = process.env.SMTP_FROM || "no-reply@bda-crm.com";
  const timeFormatted = new Date(loginTime).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "medium"
  });

  const locationBadge = workLocation === "Office" 
    ? "🏢 Office" 
    : workLocation === "Home" 
      ? "🏠 Home (Remote)" 
      : `📍 ${workLocation}`;

  const messageText = `
[STAFF LOGIN ALERT] Team Member Logged In

Hello ${adminName || "Super Admin"},

A team member has just signed in to AI POWERED BDA CRM:

• Name: ${userName}
• Email: ${userEmail}
• Role: ${userRole}
• Working From: ${locationBadge}
• Login Timestamp: ${timeFormatted} IST
${ipAddress ? `• IP Address: ${ipAddress}` : ""}

Review live team sessions and logs on your dashboard:
${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000/dashboard/team"}

Best regards,
AI POWERED BDA CRM Security & Attendance
`;

  const messageHtml = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; border: 1px solid #e5e7eb; border-radius: 12px; max-width: 580px; background-color: #ffffff; color: #1f2937;">
      <div style="border-bottom: 2px solid #6366f1; padding-bottom: 15px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h2 style="color: #6366f1; margin: 0; font-size: 20px;">AI POWERED BDA CRM</h2>
          <span style="background-color: #dbeafe; color: #1e40af; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 9999px; text-transform: uppercase;">
            Login Alert
          </span>
        </div>
        <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0 0;">Real-time Staff Login & Work Location Tracking</p>
      </div>

      <p style="font-size: 15px; font-weight: 600; margin-bottom: 12px;">Hello ${adminName || "Super Admin"},</p>
      <p style="font-size: 14px; line-height: 1.5; color: #374151; margin-bottom: 18px;">
        Team member <strong>${userName}</strong> (${userRole}) has just successfully verified and logged into their CRM account.
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; width: 140px;"><strong>Team Member:</strong></td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${userName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Email:</strong></td>
            <td style="padding: 6px 0; color: #0f172a;">${userEmail}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Role:</strong></td>
            <td style="padding: 6px 0; color: #6366f1; font-weight: 600;">${userRole}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Working From:</strong></td>
            <td style="padding: 6px 0;">
              <span style="display: inline-block; background-color: ${workLocation === "Office" ? "#d1fae5" : "#fef3c7"}; color: ${workLocation === "Office" ? "#065f46" : "#92400e"}; font-weight: 700; font-size: 13px; padding: 2px 10px; border-radius: 6px;">
                ${locationBadge}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Login Time:</strong></td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${timeFormatted} IST</td>
          </tr>
          ${ipAddress ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>IP / Network:</strong></td>
            <td style="padding: 6px 0; color: #64748b; font-family: monospace;">${ipAddress}</td>
          </tr>
          ` : ""}
        </table>
      </div>

      <div style="text-align: center; margin: 25px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000/dashboard/team"}" target="_blank" style="background-color: #6366f1; color: #ffffff; padding: 11px 26px; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.25);">
          View Team & Activity Monitor
        </a>
      </div>

      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
        Automated Security & Attendance Notification from AI POWERED BDA CRM.
      </p>
    </div>
  `;

  const transporter = getTransporter();
  if (!transporter) {
    console.log("\n==================================================");
    console.log(`[SUPER ADMIN LOGIN ALERT EMAIL MOCK]`);
    console.log(`To Admin: ${adminEmail}`);
    console.log(`User Logged In: ${userName} (${userEmail})`);
    console.log(`Role: ${userRole}`);
    console.log(`Location: ${workLocation}`);
    console.log(`Time: ${timeFormatted}`);
    console.log("==================================================\n");
    return true;
  }

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to: adminEmail,
      subject: `🚨 [STAFF LOGIN] ${userName} (${userRole}) logged in from ${workLocation}`,
      text: messageText,
      html: messageHtml
    });
    return true;
  } catch (error) {
    console.error("Failed to send Super Admin Login Alert Email via SMTP:", error);
    console.log("\n==================================================");
    console.log(`[SUPER ADMIN LOGIN ALERT EMAIL FALLBACK]`);
    console.log(`To Admin: ${adminEmail}`);
    console.log(`User: ${userName} (${workLocation})`);
    console.log("==================================================\n");
    return true;
  }
}

export async function sendUserLogoutAlertEmail({
  adminEmail,
  adminName,
  userName,
  userEmail,
  userRole,
  workLocation,
  logoutTime,
  sessionDuration
}: {
  adminEmail: string;
  adminName?: string;
  userName: string;
  userEmail: string;
  userRole: string;
  workLocation?: string;
  logoutTime: Date;
  sessionDuration?: string;
}): Promise<boolean> {
  const smtpFrom = process.env.SMTP_FROM || "no-reply@bda-crm.com";

  const timeFormatted = logoutTime.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true
  });

  const locationBadge = workLocation === "Home" ? "🏠 Home (Remote)" : "🏢 Office (In-Person)";

  const messageText = `
CRM STAFF WORK LOGOUT / CLOCK OUT ALERT

Hello ${adminName || "Super Admin"},

Team member ${userName} (${userRole}) has completed their workday and logged out of their CRM session.

Details:
- Team Member: ${userName}
- Email: ${userEmail}
- Role: ${userRole}
- Working Location: ${locationBadge}
- Clock-Out Time: ${timeFormatted} IST
${sessionDuration ? `- Session Duration: ${sessionDuration}` : ""}

Automated Notification from AI POWERED BDA CRM.
`;

  const messageHtml = `
    <div style="font-family: Arial, sans-serif; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; max-width: 580px; margin: 0 auto; color: #1f2937; background-color: #ffffff;">
      <div style="border-bottom: 2px solid #ef4444; padding-bottom: 16px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 20px; font-weight: 800; color: #ef4444; letter-spacing: -0.5px;">NEXUS AI CRM</span>
          <span style="background-color: #fee2e2; color: #b91c1c; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px;">
            CLOCK OUT NOTIFICATION
          </span>
        </div>
        <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0 0;">Real-time Staff Workday Completion & Logout Tracking</p>
      </div>

      <p style="font-size: 15px; font-weight: 600; margin-bottom: 12px;">Hello ${adminName || "Super Admin"},</p>
      <p style="font-size: 14px; line-height: 1.5; color: #374151; margin-bottom: 18px;">
        Team member <strong>${userName}</strong> (${userRole}) has completed their workday session and logged out.
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; width: 140px;"><strong>Team Member:</strong></td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${userName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Email:</strong></td>
            <td style="padding: 6px 0; color: #0f172a;">${userEmail}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Role:</strong></td>
            <td style="padding: 6px 0; color: #6366f1; font-weight: 600;">${userRole}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Worked From:</strong></td>
            <td style="padding: 6px 0;">
              <span style="display: inline-block; background-color: ${workLocation === "Office" ? "#d1fae5" : "#fef3c7"}; color: ${workLocation === "Office" ? "#065f46" : "#92400e"}; font-weight: 700; font-size: 13px; padding: 2px 10px; border-radius: 6px;">
                ${locationBadge}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Clock-out Time:</strong></td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${timeFormatted} IST</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 25px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000/dashboard/activities"}" target="_blank" style="background-color: #6366f1; color: #ffffff; padding: 11px 26px; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.25);">
          View Activity Timeline
        </a>
      </div>

      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
        Automated Security & Attendance Notification from AI POWERED BDA CRM.
      </p>
    </div>
  `;

  const transporter = getTransporter();
  if (!transporter) {
    console.log("\n==================================================");
    console.log(`[SUPER ADMIN LOGOUT ALERT EMAIL MOCK]`);
    console.log(`To Admin: ${adminEmail}`);
    console.log(`User Logged Out: ${userName} (${userEmail})`);
    console.log(`Role: ${userRole}`);
    console.log(`Location: ${workLocation}`);
    console.log(`Time: ${timeFormatted}`);
    console.log("==================================================\n");
    return true;
  }

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to: adminEmail,
      subject: `🚪 [STAFF LOGOUT] ${userName} (${userRole}) clocked out from ${workLocation || "Workplace"}`,
      text: messageText,
      html: messageHtml
    });
    return true;
  } catch (error) {
    console.error("Failed to send Super Admin Logout Alert Email via SMTP:", error);
    console.log("\n==================================================");
    console.log(`[SUPER ADMIN LOGOUT ALERT EMAIL FALLBACK]`);
    console.log(`To Admin: ${adminEmail}`);
    console.log(`User: ${userName} (${workLocation})`);
    console.log("==================================================\n");
    return true;
  }
}

export interface SendInvoiceEmailParams {
  recipientEmail: string;
  recipientName: string;
  invoiceNumber: string;
  totalAmount: number;
  currency: string;
  dueDate: Date | string;
  items: Array<{
    itemDetails: string;
    description?: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  invoiceUrl: string;
  companyName?: string;
  companyEmail?: string;
  notes?: string;
}

export async function sendInvoiceEmail(params: SendInvoiceEmailParams): Promise<boolean> {
  const { recipientEmail, recipientName, invoiceNumber, totalAmount, currency, dueDate, items, invoiceUrl, companyName, companyEmail, notes } = params;
  const smtpFrom = companyEmail || process.env.SMTP_FROM || "no-reply@bda-crm.com";
  const senderOrg = companyName || "Pixxelu Digital Technology";

  const currSymbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : currency === "AED" ? "AED " : "₹";

  const formattedTotal = `${currSymbol}${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(totalAmount)}`;

  const formattedDueDate = new Date(dueDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  const messageText = `
TAX INVOICE: ${invoiceNumber}
Hello ${recipientName || "Valued Client"},

Please find attached your tax invoice details from ${senderOrg}.

Invoice Number: ${invoiceNumber}
Total Due: ${formattedTotal}
Due Date: ${formattedDueDate}

View / Download Invoice: ${invoiceUrl}

${notes ? `Customer Note: ${notes}\n` : ""}

Thank you for your business!
${senderOrg}
`;

  const itemsRowsHtml = items.map(item => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 12px 10px; font-size: 14px; color: #1e293b;">
        <strong>${item.itemDetails}</strong>
        ${item.description ? `<div style="font-size: 12px; color: #64748b; margin-top: 2px;">${item.description}</div>` : ""}
      </td>
      <td style="padding: 12px 10px; font-size: 14px; text-align: center; color: #475569;">${item.quantity}</td>
      <td style="padding: 12px 10px; font-size: 14px; text-align: right; color: #475569; font-family: monospace;">${currSymbol}${Number(item.rate).toLocaleString()}</td>
      <td style="padding: 12px 10px; font-size: 14px; text-align: right; font-weight: 700; color: #0f172a; font-family: monospace;">${currSymbol}${Number(item.amount).toLocaleString()}</td>
    </tr>
  `).join("");

  const messageHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      
      <!-- Header Banner -->
      <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px 32px; color: #ffffff;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">${senderOrg}</h1>
              <p style="margin: 4px 0 0; font-size: 13px; color: #cbd5e1;">Official Tax Invoice & Billing Statement</p>
            </td>
            <td style="text-align: right;">
              <span style="background-color: rgba(255, 255, 255, 0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px;">
                ${invoiceNumber}
              </span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Main Body -->
      <div style="padding: 32px;">
        <p style="font-size: 16px; color: #1e293b; margin-top: 0; margin-bottom: 8px;">
          Hello <strong>${recipientName || "Valued Client"}</strong>,
        </p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 24px;">
          We appreciate your business! Here is your invoice statement from <strong>${senderOrg}</strong>. Please find the itemized breakdown below:
        </p>

        <!-- Summary Highlights Box -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 24px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; color: #64748b; font-size: 13px;">Invoice Number:</td>
              <td style="padding: 4px 0; text-align: right; font-weight: 700; color: #1e293b; font-family: monospace;">${invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b; font-size: 13px;">Due Date:</td>
              <td style="padding: 4px 0; text-align: right; font-weight: 700; color: #1e293b;">${formattedDueDate}</td>
            </tr>
            <tr style="border-top: 1px dashed #cbd5e1;">
              <td style="padding: 10px 0 0; color: #0f172a; font-size: 15px; font-weight: 700;">Total Amount Due:</td>
              <td style="padding: 10px 0 0; text-align: right; font-size: 20px; font-weight: 800; color: #2563eb; font-family: monospace;">${formattedTotal}</td>
            </tr>
          </table>
        </div>

        <!-- Deliverables Table -->
        <div style="margin-bottom: 28px;">
          <h3 style="font-size: 14px; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; margin-bottom: 10px;">Itemized Deliverables</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background-color: #f1f5f9; color: #475569; font-size: 12px; font-weight: 700; text-align: left;">
                <th style="padding: 10px;">ITEM DETAILS</th>
                <th style="padding: 10px; text-align: center;">QTY</th>
                <th style="padding: 10px; text-align: right;">RATE</th>
                <th style="padding: 10px; text-align: right;">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRowsHtml}
            </tbody>
          </table>
        </div>

        ${notes ? `
          <div style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 14px; margin-bottom: 24px; font-size: 13px; color: #713f12;">
            <strong>Customer Note:</strong> ${notes}
          </div>
        ` : ""}

        <!-- Call to Action Button -->
        <div style="text-align: center; margin: 32px 0 20px;">
          <a href="${invoiceUrl}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 14px 36px; text-decoration: none; font-weight: 700; font-size: 15px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
            📄 View & Download Official Tax Invoice PDF
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8;">
        <p style="margin: 0 0 6px;">${senderOrg}</p>
        <p style="margin: 0;">If you have any questions regarding this invoice, please contact ${companyEmail || "billing@pixxelu.com"}</p>
      </div>

    </div>
  `;

  const transporter = getTransporter();
  if (!transporter) {
    console.log("\n==================================================");
    console.log(`[INVOICE EMAIL DISPATCH MOCK]`);
    console.log(`From (Company): ${senderOrg} <${smtpFrom}>`);
    console.log(`To: ${recipientEmail} (${recipientName})`);
    console.log(`Invoice#: ${invoiceNumber}`);
    console.log(`Total: ${formattedTotal}`);
    console.log(`Link: ${invoiceUrl}`);
    console.log("==================================================\n");
    return true;
  }

  try {
    await transporter.sendMail({
      from: `"${senderOrg}" <${smtpFrom}>`,
      to: recipientEmail,
      subject: `🧾 Tax Invoice ${invoiceNumber} from ${senderOrg} - ${formattedTotal}`,
      text: messageText,
      html: messageHtml
    });
    return true;
  } catch (error) {
    console.error("Failed to send Invoice Email via SMTP:", error);
    console.log("\n==================================================");
    console.log(`[INVOICE EMAIL DISPATCH FALLBACK]`);
    console.log(`From: ${senderOrg} <${smtpFrom}>`);
    console.log(`To: ${recipientEmail}`);
    console.log(`Invoice: ${invoiceNumber} (${formattedTotal})`);
    console.log("==================================================\n");
    return true;
  }
}

// -------------------------------------------------------------
// Weekly Attendance Report Email Interfaces & Dispatchers
// -------------------------------------------------------------

export interface DeveloperWeeklyReportParams {
  developerEmail: string;
  developerName: string;
  weekStartDate: string;
  weekEndDate: string;
  totalWorkedHours: string;
  daysPresent: number;
  dailyBreakdown: Array<{
    dateStr: string;
    dayName: string;
    firstIn: string;
    lastOut: string;
    location: string;
    durationFormatted: string;
  }>;
}

export async function sendDeveloperWeeklyAttendanceEmail(params: DeveloperWeeklyReportParams): Promise<boolean> {
  const { developerEmail, developerName, weekStartDate, weekEndDate, totalWorkedHours, daysPresent, dailyBreakdown } = params;
  const smtpFrom = process.env.SMTP_FROM || "no-reply@bda-crm.com";

  const rowsHtml = dailyBreakdown.map(d => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 10px; font-weight: 600; color: #1e293b;">${d.dayName}, ${d.dateStr}</td>
      <td style="padding: 10px; text-align: center; color: #475569;">${d.firstIn || "--"}</td>
      <td style="padding: 10px; text-align: center; color: #475569;">${d.lastOut || "--"}</td>
      <td style="padding: 10px; text-align: center;">
        <span style="background: ${d.location === "Office" ? "#e0e7ff" : "#ecfdf5"}; color: ${d.location === "Office" ? "#4338ca" : "#065f46"}; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700;">
          ${d.location}
        </span>
      </td>
      <td style="padding: 10px; text-align: right; font-weight: 700; color: #2563eb; font-family: monospace;">${d.durationFormatted}</td>
    </tr>
  `).join("");

  const messageHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 24px; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px;">📅 Weekly Work & Office Attendance Report</h2>
        <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">${weekStartDate} to ${weekEndDate}</p>
      </div>

      <div style="padding: 24px;">
        <p style="font-size: 15px; color: #1e293b; margin-top: 0;">Hello <strong>${developerName}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">Here is your verified weekly attendance and work time summary recorded in the CRM:</p>

        <div style="display: flex; gap: 16px; margin: 20px 0; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
          <div style="flex: 1; text-align: center; border-right: 1px solid #e2e8f0;">
            <div style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase;">Total Time Logged</div>
            <div style="font-size: 20px; font-weight: 800; color: #4f46e5; margin-top: 4px; font-family: monospace;">${totalWorkedHours}</div>
          </div>
          <div style="flex: 1; text-align: center;">
            <div style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase;">Days Present</div>
            <div style="font-size: 20px; font-weight: 800; color: #10b981; margin-top: 4px;">${daysPresent} Days</div>
          </div>
        </div>

        <h4 style="margin: 20px 0 8px; font-size: 13px; text-transform: uppercase; color: #475569;">Daily Work Hours Breakdown</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid #e2e8f0; border-radius: 6px;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left; color: #475569; font-size: 11px;">
              <th style="padding: 8px 10px;">DAY / DATE</th>
              <th style="padding: 8px 10px; text-align: center;">CLOCK IN</th>
              <th style="padding: 8px 10px; text-align: center;">CLOCK OUT</th>
              <th style="padding: 8px 10px; text-align: center;">LOCATION</th>
              <th style="padding: 8px 10px; text-align: right;">DURATION</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>

      <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 24px; text-align: center; font-size: 12px; color: #94a3b8;">
        AI POWERED BDA CRM • Automated Weekly Performance & Attendance System
      </div>
    </div>
  `;

  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[WEEKLY DEVELOPER ATTENDANCE EMAIL MOCK] To: ${developerEmail} (${totalWorkedHours})`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to: developerEmail,
      subject: `📊 Your Weekly Attendance & Work Hours Summary (${weekStartDate} - ${weekEndDate})`,
      html: messageHtml
    });
    return true;
  } catch (err) {
    console.error("Weekly dev email failed:", err);
    return true;
  }
}

export interface SuperAdminWeeklyReportParams {
  adminEmail: string;
  adminName: string;
  weekStartDate: string;
  weekEndDate: string;
  teamMembers: Array<{
    name: string;
    email: string;
    role: string;
    totalHours: string;
    daysPresent: number;
    officeVsHome: string;
  }>;
}

export async function sendSuperAdminWeeklyTeamAttendanceEmail(params: SuperAdminWeeklyReportParams): Promise<boolean> {
  const { adminEmail, adminName, weekStartDate, weekEndDate, teamMembers } = params;
  const smtpFrom = process.env.SMTP_FROM || "no-reply@bda-crm.com";

  const memberRows = teamMembers.map(m => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 10px 12px;">
        <strong style="color: #0f172a;">${m.name}</strong>
        <div style="font-size: 11px; color: #64748b;">${m.email}</div>
      </td>
      <td style="padding: 10px; text-align: center;">
        <span style="background: #f1f5f9; color: #334155; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700;">
          ${m.role}
        </span>
      </td>
      <td style="padding: 10px; text-align: center; font-weight: 700; color: #0f172a;">
        ${m.daysPresent} Days
      </td>
      <td style="padding: 10px; text-align: center; font-size: 12px; color: #475569;">
        ${m.officeVsHome}
      </td>
      <td style="padding: 10px 12px; text-align: right; font-weight: 800; color: #4f46e5; font-family: monospace;">
        ${m.totalHours}
      </td>
    </tr>
  `).join("");

  const messageHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 26px 30px; color: #ffffff;">
        <h2 style="margin: 0; font-size: 21px;">🏢 Master Weekly Team Attendance & Hours Summary</h2>
        <p style="margin: 4px 0 0; font-size: 13px; color: #c7d2fe;">Super Admin Executive Report • ${weekStartDate} to ${weekEndDate}</p>
      </div>

      <div style="padding: 28px 30px;">
        <p style="font-size: 15px; color: #1e293b; margin-top: 0;">Hello <strong>${adminName || "Super Admin"}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 20px;">
          Below is the consolidated weekly attendance, total office work duration, and presence log for all employees and developers across the organization:
        </p>

        <table style="width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #f8fafc; text-align: left; color: #475569; font-size: 11px; text-transform: uppercase;">
              <th style="padding: 10px 12px;">EMPLOYEE / DEVELOPER</th>
              <th style="padding: 10px; text-align: center;">ROLE</th>
              <th style="padding: 10px; text-align: center;">DAYS PRESENT</th>
              <th style="padding: 10px; text-align: center;">WORK MODE</th>
              <th style="padding: 10px 12px; text-align: right;">TOTAL HOURS</th>
            </tr>
          </thead>
          <tbody>
            ${memberRows}
          </tbody>
        </table>

        <div style="margin-top: 24px; text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" target="_blank" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: 700; font-size: 13px; border-radius: 8px; display: inline-block;">
            Open Live CRM Attendance Hub
          </a>
        </div>
      </div>

      <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 24px; text-align: center; font-size: 12px; color: #94a3b8;">
        AI POWERED BDA CRM • Consolidated Weekly Intelligence Dispatch
      </div>
    </div>
  `;

  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[SUPER ADMIN MASTER WEEKLY ATTENDANCE EMAIL MOCK] To: ${adminEmail}`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to: adminEmail,
      subject: `📋 [WEEKLY TEAM REPORT] Master Attendance & Office Work Hours (${weekStartDate} - ${weekEndDate})`,
      html: messageHtml
    });
    return true;
  } catch (err) {
    console.error("Super Admin weekly email failed:", err);
    return true;
  }
}


