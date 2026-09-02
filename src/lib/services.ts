import { prisma } from "./db";
import { mockDb, Lead, Client, Project, Payment, Meeting, Activity, User, Role, Notification, Attachment } from "./mockData";
import { sendTaskAssignmentRealEmail, sendMeetingScheduleEmail } from "./email";
import * as bcrypt from "bcryptjs";

// Global flag to track if we're using mock mode (Prisma connection failed)
let isMockMode = false;
let dbCheckDone = false;

export async function checkDbConnection(): Promise<boolean> {
  if (dbCheckDone) return !isMockMode;
  try {
    // Quick probe to test connection
    await prisma.$queryRaw`SELECT 1`;
    isMockMode = false;
    console.log("Database connected successfully. Running in Postgres Mode.");
  } catch (error) {
    isMockMode = true;
    console.warn("Database connection failed. Falling back to In-Memory Demo Mode.", error);
  }
  dbCheckDone = true;
  return !isMockMode;
}

export function isDemoMode() {
  return isMockMode;
}

// -------------------------------------------------------------
// USER & ROLE SERVICES
// -------------------------------------------------------------

export async function loginUser(email: string, passwordPlain: string): Promise<User | null> {
  await checkDbConnection();
  if (isMockMode) {
    const user = mockDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    const match = await bcrypt.compare(passwordPlain, user.passwordHash);
    return match ? user : null;
  } else {
    try {
      const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });
      if (!user) return null;
      const match = await bcrypt.compare(passwordPlain, user.passwordHash);
      return match ? {
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        roleId: user.roleId,
        createdAt: user.createdAt
      } : null;
    } catch {
      return null;
    }
  }
}

export async function getUserById(id: string): Promise<(User & { role?: Role; roleName?: string }) | null> {
  await checkDbConnection();
  if (isMockMode) {
    const u = mockDb.users.find(u => u.id === id);
    if (!u) return null;
    const role = mockDb.roles.find(r => r.id === u.roleId);
    return { ...u, role, roleName: role?.name };
  } else {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: true }
    });
    if (!user) return null;
    return { ...user, roleName: user.role.name };
  }
}

export async function listUsers(): Promise<(User & { roleName?: string })[]> {
  await checkDbConnection();
  if (isMockMode) {
    return mockDb.users.map(u => ({
      ...u,
      roleName: mockDb.roles.find(r => r.id === u.roleId)?.name
    }));
  } else {
    const users = await prisma.user.findMany({ include: { role: true } });
    return users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      passwordHash: u.passwordHash,
      roleId: u.roleId,
      createdAt: u.createdAt,
      roleName: u.role.name,
      isActive: u.isActive,
      isTrashed: u.isTrashed
    }));
  }
}

export async function listBdas(): Promise<User[]> {
  const users = await listUsers();
  return users.filter(u => u.roleName === "BDA" || u.roleName === "Super Admin");
}

export async function listDevelopers(): Promise<User[]> {
  const users = await listUsers();
  return users.filter(u => u.roleName === "Developer");
}

// -------------------------------------------------------------
// LEAD SERVICES
// -------------------------------------------------------------

export async function listLeads(includeTrashed = false): Promise<any[]> {
  await checkDbConnection();
  if (isMockMode) {
    const activeLeads = mockDb.leads.filter(l => includeTrashed || !l.isTrashed);
    return activeLeads.map(l => ({
      ...l,
      primaryBda: mockDb.users.find(u => u.id === l.primaryBdaId),
      assignments: l.assignedBdaIds.map(id => ({
        user: mockDb.users.find(u => u.id === id)
      }))
    }));
  } else {
    return await prisma.lead.findMany({
      where: includeTrashed ? {} : { isTrashed: false },
      include: {
        primaryBda: true,
        assignments: { include: { user: true } }
      },
      orderBy: { createdAt: "desc" }
    });
  }
}

export async function getLeadById(id: string): Promise<any | null> {
  await checkDbConnection();
  if (isMockMode) {
    const lead = mockDb.leads.find(l => l.id === id);
    if (!lead) return null;
    return {
      ...lead,
      primaryBda: mockDb.users.find(u => u.id === lead.primaryBdaId),
      assignments: lead.assignedBdaIds.map(uid => ({
        user: mockDb.users.find(u => u.id === uid)
      })),
      activities: mockDb.activities.filter(a => a.leadId === id).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
      meetings: mockDb.meetings.filter(m => m.leadId === id).sort((a, b) => b.startTime.getTime() - a.startTime.getTime()),
      attachments: mockDb.attachments.filter(att => att.leadId === id)
    };
  } else {
    return await prisma.lead.findUnique({
      where: { id },
      include: {
        primaryBda: true,
        assignments: { include: { user: true } },
        activities: { include: { user: true }, orderBy: { timestamp: "desc" } },
        meetings: { include: { assignments: { include: { user: true } } }, orderBy: { startTime: "desc" } },
        attachments: { include: { uploadedBy: true } }
      }
    });
  }
}

export async function getLeadByLinkedinUrl(linkedinUrl: string): Promise<any> {
  if (!linkedinUrl || !linkedinUrl.trim()) return null;
  await checkDbConnection();
  const cleanUrl = linkedinUrl.trim().toLowerCase();
  if (isMockMode) {
    return mockDb.leads.find(l => l.linkedinUrl && l.linkedinUrl.toLowerCase() === cleanUrl) || null;
  } else {
    return await prisma.lead.findUnique({ where: { linkedinUrl } });
  }
}

export async function createLead(data: any, userId: string): Promise<any> {
  await checkDbConnection();
  if (data.linkedinUrl && data.linkedinUrl.trim()) {
    const existing = await getLeadByLinkedinUrl(data.linkedinUrl);
    if (existing) {
      throw new Error("This lead already exists.");
    }
  }

  if (isMockMode) {
    const newLead: Lead = {
      id: `l-${Date.now()}`,
      name: data.name,
      linkedinUrl: data.linkedinUrl,
      profilePhoto: data.profilePhoto || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
      country: data.country,
      city: data.city,
      jobTitle: data.jobTitle,
      company: data.company,
      industry: data.industry,
      serviceRequirements: data.serviceRequirements || [],
      customServiceRequirement: data.customServiceRequirement,
      leadSource: data.leadSource,
      customLeadSource: data.customLeadSource,
      status: data.status || "New",
      priority: data.priority || "Warm",
      primaryBdaId: data.primaryBdaId,
      assignedBdaIds: data.assignedBdaIds || [],
      tags: data.tags || [],
      notes: data.notes,
      nextFollowup: data.nextFollowup ? new Date(data.nextFollowup) : undefined,
      followupNotes: data.followupNotes,
      isTrashed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockDb.leads.push(newLead);
    
    // Add activity
    mockDb.activities.push({
      id: `act-${Date.now()}`,
      timestamp: new Date(),
      userId,
      type: "LinkedIn",
      notes: `Added new lead from LinkedIn: ${data.name}`,
      leadId: newLead.id
    });

    return newLead;
  } else {
    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        linkedinUrl: data.linkedinUrl || null,
        profilePhoto: data.profilePhoto || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
        country: data.country,
        city: data.city,
        jobTitle: data.jobTitle,
        company: data.company,
        industry: data.industry,
        serviceRequirements: data.serviceRequirements || [],
        customServiceRequirement: data.customServiceRequirement,
        leadSource: data.leadSource || data.source || "LinkedIn",
        customLeadSource: data.customLeadSource || data.customSource,
        status: data.status || "New",
        priority: data.priority || "Warm",
        primaryBdaId: data.primaryBdaId || null,
        tags: data.tags || [],
        notes: data.notes,
        nextFollowup: data.nextFollowup ? new Date(data.nextFollowup) : null,
        followupNotes: data.followupNotes,
        assignments: {
          create: (data.assignedBdaIds || []).filter(Boolean).map((uid: string) => ({
            userId: uid,
            role: "Additional"
          }))
        },
        activities: {
          create: {
            userId,
            type: "System",
            notes: `Lead created manually.`
          }
        }
      }
    });
    return lead;
  }
}

export async function updateLead(id: string, data: any, userId: string): Promise<any> {
  await checkDbConnection();
  if (isMockMode) {
    const leadIdx = mockDb.leads.findIndex(l => l.id === id);
    if (leadIdx === -1) throw new Error("Lead not found");
    const oldLead = mockDb.leads[leadIdx];
    const updated: Lead = {
      ...oldLead,
      ...data,
      nextFollowup: data.nextFollowup ? new Date(data.nextFollowup) : oldLead.nextFollowup,
      assignedBdaIds: data.assignedBdaIds || oldLead.assignedBdaIds,
      updatedAt: new Date()
    };
    mockDb.leads[leadIdx] = updated;

    mockDb.activities.push({
      id: `act-${Date.now()}`,
      timestamp: new Date(),
      userId,
      type: "Note",
      notes: "Lead details updated.",
      leadId: id
    });
    return updated;
  } else {
    // Delete existing assignments first
    if (data.assignedBdaIds) {
      await prisma.leadAssignment.deleteMany({ where: { leadId: id } });
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        name: data.name,
        linkedinUrl: data.linkedinUrl || null,
        profilePhoto: data.profilePhoto,
        country: data.country,
        city: data.city,
        jobTitle: data.jobTitle,
        company: data.company,
        industry: data.industry,
        serviceRequirements: data.serviceRequirements,
        customServiceRequirement: data.customServiceRequirement,
        leadSource: data.leadSource || data.source || "LinkedIn",
        customLeadSource: data.customLeadSource || data.customSource,
        status: data.status,
        priority: data.priority,
        primaryBdaId: data.primaryBdaId || null,
        tags: data.tags,
        notes: data.notes,
        nextFollowup: data.nextFollowup ? new Date(data.nextFollowup) : null,
        followupNotes: data.followupNotes,
        assignments: data.assignedBdaIds ? {
          create: data.assignedBdaIds.map((uid: string) => ({
            userId: uid,
            role: "Additional"
          }))
        } : undefined,
        activities: {
          create: {
            userId,
            type: "System",
            notes: "Lead details updated."
          }
        }
      }
    });
    return lead;
  }
}

export async function trashLead(id: string, userId: string): Promise<boolean> {
  await checkDbConnection();
  if (isMockMode) {
    const lead = mockDb.leads.find(l => l.id === id);
    if (!lead) return false;
    lead.isTrashed = true;
    mockDb.activities.push({
      id: `act-${Date.now()}`,
      timestamp: new Date(),
      userId,
      type: "System",
      notes: "Moved lead to Trash.",
      leadId: id
    });
    return true;
  } else {
    await prisma.lead.update({
      where: { id },
      data: {
        isTrashed: true,
        activities: {
          create: {
            userId,
            type: "System",
            notes: "Moved lead to Trash."
          }
        }
      }
    });
    return true;
  }
}

export async function restoreLead(id: string, userId: string): Promise<boolean> {
  await checkDbConnection();
  if (isMockMode) {
    const lead = mockDb.leads.find(l => l.id === id);
    if (!lead) return false;
    lead.isTrashed = false;
    mockDb.activities.push({
      id: `act-${Date.now()}`,
      timestamp: new Date(),
      userId,
      type: "System",
      notes: "Restored lead from Trash.",
      leadId: id
    });
    return true;
  } else {
    await prisma.lead.update({
      where: { id },
      data: {
        isTrashed: false,
        activities: {
          create: {
            userId,
            type: "System",
            notes: "Restored lead from Trash."
          }
        }
      }
    });
    return true;
  }
}

export async function deleteLeadPermanently(id: string): Promise<boolean> {
  await checkDbConnection();
  if (isMockMode) {
    mockDb.leads = mockDb.leads.filter(l => l.id !== id);
    mockDb.activities = mockDb.activities.filter(a => a.leadId !== id);
    mockDb.meetings = mockDb.meetings.filter(m => m.leadId !== id);
    return true;
  } else {
    await prisma.lead.delete({ where: { id } });
    return true;
  }
}

// -------------------------------------------------------------
// LINKEDIN PROFILE ENRICHMENT SIMULATOR
// -------------------------------------------------------------

export async function enrichLinkedInProfile(linkedinUrl: string): Promise<Partial<Lead> & { isEnriched?: boolean }> {
  // Simulate network latency of the API provider
  await new Promise(r => setTimeout(r, 600));

  // Future-proof integration layer:
  // Hook up your preferred third-party API key here (e.g. Proxycurl / Scrapin / LinkedIn API)
  const apiKey = process.env.LINKEDIN_ENRICHMENT_API_KEY;
  if (apiKey) {
    // try {
    //   const response = await fetch(`https://api.thirdparty-enrich.com/v1?url=${encodeURIComponent(linkedinUrl)}`, {
    //     headers: { 'Authorization': `Bearer ${apiKey}` }
    //   });
    //   if (response.ok) {
    //     const data = await response.json();
    //     return { ...data, isEnriched: true };
    //   }
    // } catch (e) {
    //   console.error("LinkedIn provider connection error:", e);
    // }
  }

  // Safe fallback if no provider is configured - do not invent any client details
  return {
    name: "",
    linkedinUrl,
    profilePhoto: undefined,
    company: "",
    industry: "",
    country: "",
    city: "",
    jobTitle: "",
    notes: "LinkedIn enrichment is not configured.",
    isEnriched: false
  };
}

// -------------------------------------------------------------
// CLIENT CONVERSION & MANAGEMENT
// -------------------------------------------------------------

export async function listClients(includeTrashed = false): Promise<any[]> {
  await checkDbConnection();
  if (isMockMode) {
    const active = mockDb.clients.filter(c => includeTrashed || !c.isTrashed);
    return active.map(c => {
      const projects = mockDb.projects.filter(p => p.clientId === c.id && !p.isTrashed);
      const totalBudget = projects.reduce((sum, p) => sum + p.finalBudget, 0);
      const totalPayments = mockDb.payments.filter(pay => projects.map(p => p.id).includes(pay.projectId)).reduce((sum, p) => sum + p.amount, 0);
      return {
        ...c,
        projects,
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === "Work in Progress").length,
        completedProjects: projects.filter(p => p.status === "Completed").length,
        totalProjectValue: totalBudget,
        totalReceived: totalPayments,
        totalOutstanding: totalBudget - totalPayments
      };
    });
  } else {
    const clients = await prisma.client.findMany({
      where: includeTrashed ? {} : { isTrashed: false },
      include: {
        projects: {
          where: { isTrashed: false },
          include: { payments: true }
        }
      }
    });

    return clients.map(c => {
      const totalBudget = c.projects.reduce((sum, p) => sum + p.finalBudget, 0);
      const totalReceived = c.projects.reduce((sum, p) => sum + p.payments.reduce((s, pay) => s + pay.amount, 0), 0);
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        company: c.company,
        industry: c.industry,
        logo: c.logo,
        phone: c.phone,
        website: c.website,
        isTrashed: c.isTrashed,
        projects: c.projects,
        totalProjects: c.projects.length,
        activeProjects: c.projects.filter(p => p.status === "Work in Progress").length,
        completedProjects: c.projects.filter(p => p.status === "Completed").length,
        totalProjectValue: totalBudget,
        totalReceived,
        totalOutstanding: totalBudget - totalReceived
      };
    });
  }
}

export async function getClientById(id: string): Promise<any | null> {
  await checkDbConnection();
  if (isMockMode) {
    const client = mockDb.clients.find(c => c.id === id);
    if (!client) return null;
    const projects = mockDb.projects.filter(p => p.clientId === id && !p.isTrashed);
    const lead = mockDb.leads.find(l => l.convertedClientId === id);
    const payments = mockDb.payments.filter(pay => projects.map(p => p.id).includes(pay.projectId));
    return {
      ...client,
      projects: projects.map(p => ({
        ...p,
        received: payments.filter(pay => pay.projectId === p.id).reduce((sum, pay) => sum + pay.amount, 0)
      })),
      lead,
      activities: mockDb.activities.filter(a => a.clientId === id).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    };
  } else {
    return await prisma.client.findUnique({
      where: { id },
      include: {
        projects: {
          where: { isTrashed: false },
          include: { payments: true }
        },
        leadSource: true,
        activities: { include: { user: true }, orderBy: { timestamp: "desc" } }
      }
    });
  }
}

export async function convertLeadToClient(leadId: string, clientData: any, userId: string): Promise<any> {
  await checkDbConnection();
  if (isMockMode) {
    const lead = mockDb.leads.find(l => l.id === leadId);
    if (!lead) throw new Error("Lead not found");

    const newClient: Client = {
      id: `c-${Date.now()}`,
      name: clientData.name || lead.name,
      email: clientData.email || `${lead.name.toLowerCase().replace(/\s+/g, "")}@company.com`,
      company: clientData.company || lead.company,
      industry: clientData.industry || lead.industry,
      logo: lead.profilePhoto,
      phone: clientData.phone,
      website: clientData.website,
      isTrashed: false,
      leadId,
      createdAt: new Date()
    };
    mockDb.clients.push(newClient);

    // Update lead status
    lead.status = "Won";
    lead.convertedClientId = newClient.id;
    lead.convertedAt = new Date();

    // System activity
    mockDb.activities.push({
      id: `act-${Date.now()}`,
      timestamp: new Date(),
      userId,
      type: "System",
      notes: `Converted Lead to Client account: ${newClient.name}`,
      leadId,
      clientId: newClient.id
    });

    return newClient;
  } else {
    // Transaction
    return await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({ where: { id: leadId } });
      if (!lead) throw new Error("Lead not found");

      const client = await tx.client.create({
        data: {
          name: clientData.name || lead.name,
          email: clientData.email,
          company: clientData.company || lead.company,
          industry: clientData.industry || lead.industry,
          logo: lead.profilePhoto,
          phone: clientData.phone,
          website: clientData.website,
        }
      });

      await tx.lead.update({
        where: { id: leadId },
        data: {
          status: "Won",
          convertedClientId: client.id,
          convertedAt: new Date()
        }
      });

      await tx.activity.create({
        data: {
          userId,
          type: "System",
          notes: `Converted Lead to Client account.`,
          leadId,
          clientId: client.id
        }
      });

      return client;
    });
  }
}

// -------------------------------------------------------------
// PROJECT MANAGEMENT
// -------------------------------------------------------------

export async function listProjects(includeTrashed = false, userContext?: { userId: string; roleName: string }): Promise<any[]> {
  await checkDbConnection();
  const isDeveloper = userContext?.roleName === "Developer";
  const userId = userContext?.userId;

  if (isMockMode) {
    let active = mockDb.projects.filter(p => includeTrashed || !p.isTrashed);
    return active.map(p => {
      const client = mockDb.clients.find(c => c.id === p.clientId);
      const primaryBda = mockDb.users.find(u => u.id === p.primaryBdaId);
      const payments = isDeveloper ? [] : mockDb.payments.filter(pay => pay.projectId === p.id);
      const totalReceived = isDeveloper ? 0 : payments.reduce((sum, pay) => sum + pay.amount, 0);
      return {
        ...p,
        finalBudget: isDeveloper ? 0 : p.finalBudget,
        bonus: isDeveloper ? 0 : p.bonus,
        client,
        primaryBda,
        totalReceived,
        pendingAmount: isDeveloper ? 0 : p.finalBudget - totalReceived,
        payments
      };
    });
  } else {
    // If developer, only fetch projects where developer is assigned (or member of project conversation)
    const whereClause: any = includeTrashed ? {} : { isTrashed: false };
    if (isDeveloper && userId) {
      whereClause.conversations = {
        some: {
          members: {
            some: {
              userId
            }
          }
        }
      };
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        client: true,
        primaryBda: true,
        payments: !isDeveloper
      },
      orderBy: { deadline: "asc" }
    });

    return projects.map(p => {
      const payments = (p as any).payments || [];
      const totalReceived = isDeveloper ? 0 : payments.reduce((sum: number, pay: any) => sum + pay.amount, 0);
      return {
        ...p,
        finalBudget: isDeveloper ? 0 : p.finalBudget,
        bonus: isDeveloper ? 0 : p.bonus,
        totalReceived,
        pendingAmount: isDeveloper ? 0 : p.finalBudget - totalReceived,
        payments: isDeveloper ? [] : payments
      };
    });
  }
}

export async function getProjectById(id: string, userContext?: { userId: string; roleName: string }): Promise<any | null> {
  await checkDbConnection();
  const isDeveloper = userContext?.roleName === "Developer";
  const userId = userContext?.userId;

  if (isMockMode) {
    const project = mockDb.projects.find(p => p.id === id);
    if (!project) return null;
    const client = mockDb.clients.find(c => c.id === project.clientId);
    const primaryBda = mockDb.users.find(u => u.id === project.primaryBdaId);
    const payments = isDeveloper ? [] : mockDb.payments.filter(pay => pay.projectId === id).sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());
    const totalReceived = isDeveloper ? 0 : payments.reduce((sum, pay) => sum + pay.amount, 0);
    const ownershipHistory = isDeveloper ? [] : mockDb.ownershipHistory
      .filter(h => h.projectId === id)
      .map(h => ({
        ...h,
        newBda: mockDb.users.find(u => u.id === h.newBdaId),
        previousBda: mockDb.users.find(u => u.id === h.previousBdaId)
      }));

    return {
      ...project,
      finalBudget: isDeveloper ? 0 : project.finalBudget,
      bonus: isDeveloper ? 0 : project.bonus,
      client,
      primaryBda,
      payments,
      totalReceived,
      pendingAmount: isDeveloper ? 0 : project.finalBudget - totalReceived,
      ownershipHistory,
      activities: mockDb.activities.filter(a => a.projectId === id).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
      attachments: mockDb.attachments.filter(att => att.projectId === id)
    };
  } else {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        primaryBda: true,
        payments: isDeveloper ? false : { orderBy: { paymentDate: "desc" } },
        ownershipHistory: isDeveloper ? false : { include: { newBda: true }, orderBy: { takeoverDate: "desc" } },
        activities: { include: { user: true }, orderBy: { timestamp: "desc" } },
        attachments: { include: { uploadedBy: true } },
        conversations: {
          select: {
            id: true,
            members: { select: { userId: true } }
          }
        }
      }
    });

    if (!project) return null;

    // If developer, verify developer is assigned to this project
    if (isDeveloper && userId) {
      const isMember = project.conversations.some(c => c.members.some(m => m.userId === userId));
      if (!isMember) return null; // Developer unauthorized to view unassigned project
    }

    let closeOutcome = undefined;
    let clientRating = undefined;
    let clientFeedback = undefined;
    let currency = "INR";
    let pricingModel = "Fixed";
    let hourlyRate = undefined;
    let estimatedHours = undefined;
    let cleanNotes = project.notes;
    try {
      if (project.notes && project.notes.startsWith("{") && project.notes.endsWith("}")) {
        const parsed = JSON.parse(project.notes);
        closeOutcome = parsed.closeOutcome;
        clientRating = parsed.clientRating;
        clientFeedback = parsed.clientFeedback;
        currency = parsed.currency || "INR";
        pricingModel = parsed.pricingModel || "Fixed";
        hourlyRate = parsed.hourlyRate;
        estimatedHours = parsed.estimatedHours;
        cleanNotes = parsed.generalNotes || "";
      }
    } catch {
      // Keep cleanNotes
    }

    const payments = (project as any).payments || [];
    const totalReceived = isDeveloper ? 0 : payments.reduce((sum: number, pay: any) => sum + pay.amount, 0);
    return {
      ...project,
      notes: cleanNotes,
      closeOutcome,
      clientRating,
      clientFeedback,
      currency: (project as any).currency || currency,
      pricingModel: (project as any).pricingModel || pricingModel,
      hourlyRate: (project as any).hourlyRate || hourlyRate,
      estimatedHours: (project as any).estimatedHours || estimatedHours,
      finalBudget: isDeveloper ? 0 : project.finalBudget,
      bonus: isDeveloper ? 0 : project.bonus,
      totalReceived,
      pendingAmount: isDeveloper ? 0 : project.finalBudget - totalReceived,
      payments: isDeveloper ? [] : payments,
      ownershipHistory: isDeveloper ? [] : (project as any).ownershipHistory || []
    };
  }
}

export async function createProject(data: any, userId: string): Promise<any> {
  await checkDbConnection();
  const currency = data.currency || "INR";
  const pricingModel = data.pricingModel || "Fixed";
  const hourlyRate = data.hourlyRate ? parseFloat(data.hourlyRate) : undefined;
  const estimatedHours = data.estimatedHours ? parseFloat(data.estimatedHours) : undefined;

  if (isMockMode) {
    const newProj: Project = {
      id: `p-${Date.now()}`,
      name: data.name,
      clientId: data.clientId,
      source: data.source,
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      deadline: new Date(data.deadline),
      finalBudget: parseFloat(data.finalBudget),
      bonus: data.bonus ? parseFloat(data.bonus) : 0,
      currency,
      pricingModel,
      hourlyRate,
      estimatedHours,
      primaryBdaId: data.primaryBdaId,
      serviceType: data.serviceType,
      status: "Work in Progress",
      isTrashed: false,
      createdAt: new Date()
    };
    mockDb.projects.push(newProj);

    mockDb.activities.push({
      id: `act-${Date.now()}`,
      timestamp: new Date(),
      userId,
      type: "System",
      notes: `Created project ${data.name} (${currency} ${pricingModel})`,
      projectId: newProj.id
    });

    return newProj;
  } else {
    // Pack extra config into JSON notes
    const projectNotesObj = {
      currency,
      pricingModel,
      hourlyRate,
      estimatedHours,
      generalNotes: data.notes || ""
    };

    return await prisma.project.create({
      data: {
        name: data.name,
        clientId: data.clientId,
        source: data.source,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        deadline: new Date(data.deadline),
        finalBudget: parseFloat(data.finalBudget),
        bonus: data.bonus ? parseFloat(data.bonus) : 0,
        primaryBdaId: data.primaryBdaId,
        serviceType: data.serviceType,
        status: "Work in Progress",
        notes: JSON.stringify(projectNotesObj),
        activities: {
          create: {
            userId,
            type: "System",
            notes: `Project created (${currency} ${pricingModel}).`
          }
        }
      }
    });
  }
}

export async function updateProject(id: string, data: any, userId: string): Promise<any> {
  await checkDbConnection();
  if (isMockMode) {
    const idx = mockDb.projects.findIndex(p => p.id === id);
    if (idx === -1) throw new Error("Project not found");
    const old = mockDb.projects[idx];
    
    // Check if status changed to 'Issue'
    let notes = "Project updated.";
    if (data.status === "Issue" && old.status !== "Issue") {
      notes = `Project status flagged as Issue: ${data.issueDescription}`;
    }

    const updated: Project = {
      ...old,
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : old.startDate,
      deadline: data.deadline ? new Date(data.deadline) : old.deadline,
      finalBudget: data.finalBudget ? parseFloat(data.finalBudget) : old.finalBudget,
      bonus: data.bonus !== undefined ? parseFloat(data.bonus) : old.bonus,
      currency: data.currency !== undefined ? data.currency : old.currency,
      pricingModel: data.pricingModel !== undefined ? data.pricingModel : old.pricingModel,
      hourlyRate: data.hourlyRate !== undefined ? parseFloat(data.hourlyRate) : old.hourlyRate,
      estimatedHours: data.estimatedHours !== undefined ? parseFloat(data.estimatedHours) : old.estimatedHours,
      closeOutcome: data.closeOutcome !== undefined ? data.closeOutcome : old.closeOutcome,
      clientRating: data.clientRating !== undefined ? (Number(data.clientRating) || 5) : old.clientRating,
      clientFeedback: data.clientFeedback !== undefined ? data.clientFeedback : old.clientFeedback,
    };
    mockDb.projects[idx] = updated;

    mockDb.activities.push({
      id: `act-${Date.now()}`,
      timestamp: new Date(),
      userId,
      type: data.status === "Issue" ? "Other" : "System",
      notes,
      projectId: id
    });

    return updated;
  } else {
    const old = await prisma.project.findUnique({ where: { id } });
    let notes = "Project updated.";
    if (data.status === "Issue" && old?.status !== "Issue") {
      notes = `Project status flagged as Issue: ${data.issueDescription}`;
    }

    // Preserve and merge JSON review & pricing metadata in notes
    let projectNotesObj: any = {};
    try {
      if (old?.notes && old.notes.startsWith("{") && old.notes.endsWith("}")) {
        projectNotesObj = JSON.parse(old.notes);
      }
    } catch {
      projectNotesObj = { generalNotes: old?.notes || "" };
    }

    if (data.currency !== undefined) projectNotesObj.currency = data.currency;
    if (data.pricingModel !== undefined) projectNotesObj.pricingModel = data.pricingModel;
    if (data.hourlyRate !== undefined) projectNotesObj.hourlyRate = parseFloat(data.hourlyRate);
    if (data.estimatedHours !== undefined) projectNotesObj.estimatedHours = parseFloat(data.estimatedHours);
    if (data.closeOutcome !== undefined) projectNotesObj.closeOutcome = data.closeOutcome;
    if (data.clientRating !== undefined) projectNotesObj.clientRating = Number(data.clientRating) || 5;
    if (data.clientFeedback !== undefined) projectNotesObj.clientFeedback = data.clientFeedback;
    if (data.notes !== undefined) projectNotesObj.generalNotes = data.notes;

    const savedNotes = Object.keys(projectNotesObj).length > 0 ? JSON.stringify(projectNotesObj) : data.notes;

    return await prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        source: data.source,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        finalBudget: data.finalBudget ? parseFloat(data.finalBudget) : undefined,
        bonus: data.bonus !== undefined ? parseFloat(data.bonus) : undefined,
        status: data.status,
        issueDescription: data.issueDescription,
        notes: savedNotes,
        activities: {
          create: {
            userId,
            type: data.status === "Issue" ? "Other" : "System",
            notes
          }
        }
      }
    });
  }
}

export async function takeOverProject(id: string, newBdaId: string, note: string, userId: string): Promise<boolean> {
  await checkDbConnection();
  if (isMockMode) {
    const project = mockDb.projects.find(p => p.id === id);
    if (!project) return false;

    const previousBdaId = project.primaryBdaId;
    project.primaryBdaId = newBdaId;

    mockDb.ownershipHistory.push({
      id: `history-${Date.now()}`,
      projectId: id,
      previousBdaId,
      newBdaId,
      takeoverDate: new Date(),
      note
    });

    const prevUser = mockDb.users.find(u => u.id === previousBdaId)?.name || "Previous BDA";
    const newUser = mockDb.users.find(u => u.id === newBdaId)?.name || "New BDA";

    mockDb.activities.push({
      id: `act-${Date.now()}`,
      timestamp: new Date(),
      userId,
      type: "System",
      notes: `${newUser} took over project ownership from ${prevUser}. Note: ${note}`,
      projectId: id
    });

    // Notify new BDA
    mockDb.notifications.push({
      id: `n-${Date.now()}`,
      title: "Project Takeover",
      message: `You have taken over ownership of project: ${project.name}`,
      type: "ProjectTakeover",
      isRead: false,
      userId: newBdaId,
      linkUrl: `/dashboard/projects/${id}`,
      createdAt: new Date()
    });

    return true;
  } else {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return false;

    await prisma.$transaction([
      prisma.project.update({
        where: { id },
        data: {
          primaryBdaId: newBdaId,
          ownershipHistory: {
            create: {
              previousBdaId: project.primaryBdaId,
              newBdaId,
              note
            }
          },
          activities: {
            create: {
              userId,
              type: "System",
              notes: `Project taken over by BDA.`
            }
          }
        }
      }),
      prisma.notification.create({
        data: {
          title: "Project Takeover",
          message: `You have taken over ownership of project: ${project.name}`,
          type: "ProjectTakeover",
          userId: newBdaId,
          linkUrl: `/dashboard/projects/${id}`
        }
      })
    ]);
    return true;
  }
}

export async function addPayment(projectId: string, amount: number, note: string, userId: string): Promise<any> {
  await checkDbConnection();
  if (isMockMode) {
    const payment: Payment = {
      id: `pay-${Date.now()}`,
      projectId,
      amount,
      note,
      recordedById: userId,
      paymentDate: new Date(),
      createdAt: new Date()
    };
    mockDb.payments.push(payment);

    const project = mockDb.projects.find(p => p.id === projectId);
    const formatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
    mockDb.activities.push({
      id: `act-${Date.now()}`,
      timestamp: new Date(),
      userId,
      type: "System",
      notes: `Recorded payment of ${formatter.format(amount)}. Note: ${note}`,
      projectId
    });

    return payment;
  } else {
    const formatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
    return await prisma.payment.create({
      data: {
        projectId,
        amount,
        note,
        recordedById: userId
      }
    }).then(async (p) => {
      await prisma.activity.create({
        data: {
          userId,
          type: "System",
          notes: `Recorded payment of ${formatter.format(amount)}. Note: ${note}`,
          projectId
        }
      });
      return p;
    });
  }
}

export async function sendDevAssignmentEmail(projectId: string, devId: string, workDetails: string): Promise<boolean> {
  await checkDbConnection();

  let devUser: any = null;
  let projectData: any = null;

  if (isMockMode) {
    devUser = mockDb.users.find(u => u.id === devId);
    projectData = mockDb.projects.find(p => p.id === projectId);
    const devName = devUser?.name || "Developer";

    mockDb.activities.push({
      id: `act-${Date.now()}`,
      timestamp: new Date(),
      userId: devId,
      type: "System",
      notes: `Project assignment email dispatched to developer ${devName}. Requirements: ${workDetails}`,
      projectId
    });
  } else {
    devUser = await prisma.user.findUnique({ where: { id: devId } });
    projectData = await prisma.project.findUnique({
      where: { id: projectId },
      include: { client: true }
    });

    const devName = devUser?.name || "Developer";

    await prisma.activity.create({
      data: {
        userId: devId,
        type: "System",
        notes: `Project assignment email dispatched to developer ${devName}. Requirements: ${workDetails}`,
        projectId
      }
    });

    // In-App Notification for developer
    try {
      await prisma.notification.create({
        data: {
          title: "New Task Assigned",
          message: `You have been assigned a task on project: ${projectData?.name || "Project"}`,
          type: "NewProject",
          userId: devId,
          linkUrl: `/dashboard/projects/${projectId}`
        }
      });
    } catch (notifErr) {
      console.error("Failed to create in-app notification for dev assignment:", notifErr);
    }

    try {
      // Find or create Project conversation
      let conv = await prisma.conversation.findUnique({
        where: { projectId }
      });
      if (!conv) {
        // Find project BDA to add as default BDA member
        const proj = await prisma.project.findUnique({ where: { id: projectId } });
        conv = await prisma.conversation.create({
          data: {
            type: "PROJECT",
            projectId,
            members: proj ? {
              create: {
                userId: proj.primaryBdaId
              }
            } : undefined
          }
        });
      }

      // Add developer as conversation member
      const existingMember = await prisma.conversationMember.findUnique({
        where: {
          conversationId_userId: {
            conversationId: conv.id,
            userId: devId
          }
        }
      });
      if (!existingMember) {
        await prisma.conversationMember.create({
          data: {
            conversationId: conv.id,
            userId: devId
          }
        });
      }
    } catch (chatErr) {
      console.error("Failed to add developer to project conversation:", chatErr);
    }
  }

  // Send real email via Gmail SMTP
  if (devUser?.email && projectData) {
    try {
      await sendTaskAssignmentRealEmail({
        devName: devUser.name,
        devEmail: devUser.email,
        projectName: projectData.name,
        clientName: projectData.client?.name ? `${projectData.client.name} (${projectData.client.company || ""})` : undefined,
        serviceType: projectData.serviceType,
        deadline: projectData.deadline ? new Date(projectData.deadline).toLocaleDateString() : undefined,
        workDetails,
        projectUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/projects/${projectId}`
      });
    } catch (emailError) {
      console.error("Error sending real developer task assignment email:", emailError);
    }
  }

  return true;
}

// -------------------------------------------------------------
// MEETINGS & CALENDAR SERVICES
// -------------------------------------------------------------

export async function listMeetings(): Promise<any[]> {
  await checkDbConnection();
  if (isMockMode) {
    return mockDb.meetings.map(m => {
      const lead = mockDb.leads.find(l => l.id === m.leadId);
      const project = mockDb.projects.find(p => p.id === m.projectId);
      return {
        ...m,
        lead,
        project,
        assignments: m.assignedUserIds.map(uid => ({
          user: mockDb.users.find(u => u.id === uid)
        }))
      };
    });
  } else {
    return await prisma.meeting.findMany({
      include: {
        lead: true,
        project: true,
        assignments: { include: { user: true } }
      },
      orderBy: { startTime: "asc" }
    });
  }
}

export async function createMeeting(data: any, userId: string): Promise<any> {
  await checkDbConnection();
  if (isMockMode) {
    const newM: Meeting = {
      id: `m-${Date.now()}`,
      title: data.title,
      type: data.type || "Call",
      startTime: new Date(data.startTime),
      endTime: data.endTime ? new Date(data.endTime) : undefined,
      status: "Upcoming",
      notes: data.notes,
      leadId: data.leadId,
      projectId: data.projectId,
      assignedUserIds: data.assignedUserIds || [userId],
      createdAt: new Date()
    };
    mockDb.meetings.push(newM);

    mockDb.activities.push({
      id: `act-${Date.now()}`,
      timestamp: new Date(),
      userId,
      type: "Meeting",
      notes: `Scheduled a new ${newM.type}: "${newM.title}" for ${newM.startTime.toLocaleString()}`,
      leadId: data.leadId,
      projectId: data.projectId
    });

    // Notify assigned users
    (data.assignedUserIds || [userId]).forEach((uid: string) => {
      mockDb.notifications.push({
        id: `n-${Date.now()}-${uid}`,
        title: `Meeting Scheduled`,
        message: `New meeting "${newM.title}" assigned to you for ${newM.startTime.toLocaleString()}`,
        type: "MeetingReminder",
        isRead: false,
        userId: uid,
        linkUrl: `/dashboard/leads/${data.leadId || ""}`,
        createdAt: new Date()
      });
    });

    return newM;
  } else {
    const meeting = await prisma.meeting.create({
      data: {
        title: data.title,
        type: data.type || "Call",
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : null,
        status: "Upcoming",
        notes: data.notes,
        leadId: data.leadId || null,
        projectId: data.projectId || null,
        assignments: {
          create: (data.assignedUserIds || [userId]).map((uid: string) => ({
            userId: uid
          }))
        }
      },
      include: {
        lead: true,
        project: true,
        assignments: { include: { user: true } }
      }
    });

    await prisma.activity.create({
      data: {
        userId,
        type: "Meeting",
        notes: `Scheduled a new meeting: "${data.title}"`,
        leadId: data.leadId || null,
        projectId: data.projectId || null
      }
    });

    // Create notifications for all assigned users & send email
    const assignedIds: string[] = data.assignedUserIds || [userId];
    const organizer = await prisma.user.findUnique({ where: { id: userId } });
    const organizerName = organizer?.name || "Team Member";

    // Extract meet link from notes if present
    const meetLinkMatch = data.notes?.match(/https:\/\/[^\s]+/);
    const meetLink = meetLinkMatch ? meetLinkMatch[0] : undefined;

    for (const uid of assignedIds) {
      // 1. Create in-app notification
      await prisma.notification.create({
        data: {
          title: `Meeting Scheduled: ${data.title}`,
          message: `${organizerName} scheduled a ${data.type || "Meeting"} for ${new Date(data.startTime).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}`,
          type: "MeetingReminder",
          userId: uid,
          linkUrl: `/dashboard/calendar`
        }
      }).catch(e => console.error("Notification creation error:", e));

      // 2. Send email notification if user has an email
      try {
        const attendee = await prisma.user.findUnique({ where: { id: uid } });
        if (attendee?.email) {
          await sendMeetingScheduleEmail({
            attendeeEmail: attendee.email,
            attendeeName: attendee.name,
            organizerName,
            meetingTitle: data.title,
            meetingType: data.type || "Meeting",
            startTime: data.startTime,
            notes: data.notes,
            meetLink
          });
        }
      } catch (emailErr) {
        console.error("Failed to send meeting email notification:", emailErr);
      }
    }

    return meeting;
  }
}

export async function updateMeeting(id: string, data: any, userId: string): Promise<any> {
  await checkDbConnection();
  if (isMockMode) {
    const idx = mockDb.meetings.findIndex(m => m.id === id);
    if (idx === -1) throw new Error("Meeting not found");
    const old = mockDb.meetings[idx];

    let notes = `Meeting details updated.`;
    if (data.status && data.status !== old.status) {
      notes = `Meeting status updated from ${old.status} to ${data.status}.`;
    }

    const updated: Meeting = {
      ...old,
      ...data,
      startTime: data.startTime ? new Date(data.startTime) : old.startTime,
      endTime: data.endTime ? new Date(data.endTime) : old.endTime,
      assignedUserIds: data.assignedUserIds || old.assignedUserIds
    };
    mockDb.meetings[idx] = updated;

    mockDb.activities.push({
      id: `act-${Date.now()}`,
      timestamp: new Date(),
      userId,
      type: "Meeting",
      notes,
      leadId: old.leadId,
      projectId: old.projectId
    });

    return updated;
  } else {
    const old = await prisma.meeting.findUnique({ where: { id } });
    let notes = `Meeting details updated.`;
    if (data.status && data.status !== old?.status) {
      notes = `Meeting status updated from ${old?.status} to ${data.status}.`;
    }

    if (data.assignedUserIds) {
      await prisma.meetingAssignment.deleteMany({ where: { meetingId: id } });
    }

    const meeting = await prisma.meeting.update({
      where: { id },
      data: {
        title: data.title,
        type: data.type,
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        endTime: data.endTime ? new Date(data.endTime) : undefined,
        status: data.status,
        notes: data.notes,
        assignments: data.assignedUserIds ? {
          create: data.assignedUserIds.map((uid: string) => ({
            userId: uid
          }))
        } : undefined
      }
    });

    await prisma.activity.create({
      data: {
        userId,
        type: "Meeting",
        notes,
        leadId: old?.leadId || null,
        projectId: old?.projectId || null
      }
    });

    return meeting;
  }
}

export async function deleteMeeting(id: string, userId: string): Promise<boolean> {
  await checkDbConnection();
  if (isMockMode) {
    const idx = mockDb.meetings.findIndex(m => m.id === id);
    if (idx !== -1) {
      mockDb.meetings.splice(idx, 1);
    }
    return true;
  } else {
    await prisma.meetingAssignment.deleteMany({ where: { meetingId: id } });
    await prisma.meeting.delete({ where: { id } });
    return true;
  }
}

// -------------------------------------------------------------
// NOTIFICATIONS SERVICES
// -------------------------------------------------------------

export async function listNotifications(userId: string): Promise<any[]> {
  await checkDbConnection();
  if (isMockMode) {
    return mockDb.notifications.filter(n => n.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } else {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  }
}

export async function markNotificationRead(id: string): Promise<boolean> {
  await checkDbConnection();
  if (isMockMode) {
    const notif = mockDb.notifications.find(n => n.id === id);
    if (!notif) return false;
    notif.isRead = true;
    return true;
  } else {
    await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    return true;
  }
}

export async function addNotification(userId: string, title: string, message: string, type: string, linkUrl?: string): Promise<any> {
  await checkDbConnection();
  if (isMockMode) {
    const notif: Notification = {
      id: `n-${Date.now()}`,
      title,
      message,
      type,
      isRead: false,
      userId,
      linkUrl,
      createdAt: new Date()
    };
    mockDb.notifications.push(notif);
    return notif;
  } else {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        linkUrl
      }
    });
  }
}

// -------------------------------------------------------------
// GLOBAL ACTIVITIES TIMELINE
// -------------------------------------------------------------

export async function listActivities(userContext?: { userId: string; roleName: string }): Promise<any[]> {
  await checkDbConnection();
  const isSuperAdmin = userContext?.roleName === "Super Admin";
  const isDeveloper = userContext?.roleName === "Developer";
  const userId = userContext?.userId;

  if (isMockMode) {
    let list = mockDb.activities;

    // Role-based filtering
    if (!isSuperAdmin && userId) {
      if (isDeveloper) {
        // Developer only sees their own activities OR activities in projects they are involved in
        const devProjectIds = new Set(
          mockDb.projects
            .filter(p => p.primaryBdaId === userId || (p as any).assignedDevId === userId)
            .map(p => p.id)
        );
        list = list.filter(a => {
          // Hide payment activities completely for developers
          if (a.notes.toLowerCase().includes("payment") || a.notes.toLowerCase().includes("inr") || a.type === "Payment") {
            return false;
          }
          return a.userId === userId || (a.projectId && devProjectIds.has(a.projectId));
        });
      } else {
        // BDA only sees activities they created or linked to their leads/projects
        const bdaLeadIds = new Set(mockDb.leads.filter(l => l.primaryBdaId === userId || l.assignedBdaIds.includes(userId)).map(l => l.id));
        const bdaProjectIds = new Set(mockDb.projects.filter(p => p.primaryBdaId === userId).map(p => p.id));
        list = list.filter(a => a.userId === userId || (a.leadId && bdaLeadIds.has(a.leadId)) || (a.projectId && bdaProjectIds.has(a.projectId)));
      }
    }

    return list
      .map(a => ({
        ...a,
        user: mockDb.users.find(u => u.id === a.userId),
        lead: mockDb.leads.find(l => l.id === a.leadId),
        project: mockDb.projects.find(p => p.id === a.projectId),
        client: mockDb.clients.find(c => c.id === a.clientId)
      }))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  } else {
    // Database query with role-based filtering
    let whereClause: any = {};

    if (!isSuperAdmin && userId) {
      if (isDeveloper) {
        whereClause = {
          AND: [
            {
              NOT: [
                { notes: { contains: "payment", mode: "insensitive" } },
                { notes: { contains: "inr", mode: "insensitive" } }
              ]
            },
            {
              OR: [
                { userId },
                {
                  project: {
                    conversations: {
                      some: {
                        members: { some: { userId } }
                      }
                    }
                  }
                }
              ]
            }
          ]
        };
      } else {
        // BDA
        whereClause = {
          OR: [
            { userId },
            { lead: { OR: [{ primaryBdaId: userId }, { assignments: { some: { userId } } }] } },
            { project: { primaryBdaId: userId } }
          ]
        };
      }
    }

    return await prisma.activity.findMany({
      where: whereClause,
      include: {
        user: true,
        lead: true,
        project: true,
        client: true
      },
      orderBy: { timestamp: "desc" }
    });
  }
}

export async function createActivity(data: {
  type: string;
  notes: string;
  userId: string;
  leadId?: string | null;
  projectId?: string | null;
  clientId?: string | null;
}): Promise<any> {
  await checkDbConnection();
  if (isMockMode) {
    const act = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date(),
      userId: data.userId,
      type: data.type || "Note",
      notes: data.notes,
      leadId: data.leadId || undefined,
      projectId: data.projectId || undefined,
      clientId: data.clientId || undefined
    };
    mockDb.activities.push(act as any);
    return act;
  } else {
    return await prisma.activity.create({
      data: {
        userId: data.userId,
        type: data.type || "Note",
        notes: data.notes,
        leadId: data.leadId || null,
        projectId: data.projectId || null,
        clientId: data.clientId || null
      }
    });
  }
}

// -------------------------------------------------------------
// ATTACHMENTS SERVICES
// -------------------------------------------------------------

export async function addAttachment(data: any): Promise<any> {
  await checkDbConnection();
  if (isMockMode) {
    const att: Attachment = {
      id: `att-${Date.now()}`,
      name: data.name,
      url: data.url || "/placeholder-doc.pdf",
      fileType: data.fileType,
      size: data.size || 1024 * 100, // 100 KB default
      uploadedById: data.uploadedById,
      leadId: data.leadId,
      projectId: data.projectId,
      createdAt: new Date()
    };
    mockDb.attachments.push(att);

    mockDb.activities.push({
      id: `act-${Date.now()}`,
      timestamp: new Date(),
      userId: data.uploadedById,
      type: "Note",
      notes: `Uploaded file: ${data.name}`,
      leadId: data.leadId,
      projectId: data.projectId
    });

    return att;
  } else {
    return await prisma.attachment.create({
      data: {
        name: data.name,
        url: data.url || "/placeholder-doc.pdf",
        fileType: data.fileType,
        size: data.size || 102400,
        uploadedById: data.uploadedById,
        leadId: data.leadId || null,
        projectId: data.projectId || null,
      }
    });
  }
}

export async function deleteAttachment(id: string): Promise<boolean> {
  await checkDbConnection();
  if (isMockMode) {
    mockDb.attachments = mockDb.attachments.filter(a => a.id !== id);
    return true;
  } else {
    await prisma.attachment.delete({ where: { id } });
    return true;
  }
}

export async function registerUser(name: string, email: string, passwordPlain: string): Promise<any> {
  await checkDbConnection();
  const cleanEmail = email.trim().toLowerCase();

  if (isMockMode) {
    const existing = mockDb.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error("A user with this email already exists.");
    }

    let role = mockDb.roles.find(r => r.name === "Other");
    if (!role) {
      const newRole = { id: `r-${Date.now()}`, name: "Other", permissions: ["read:basic"] };
      mockDb.roles.push(newRole);
      role = newRole;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordPlain, salt);

    const newUser = {
      id: `u-${Date.now()}`,
      name,
      email: cleanEmail,
      passwordHash,
      roleId: role.id,
      createdAt: new Date()
    };
    mockDb.users.push(newUser);
    return newUser;
  } else {
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      throw new Error("A user with this email already exists.");
    }

    let role = await prisma.role.findUnique({ where: { name: "Other" } });
    if (!role) {
      role = await prisma.role.create({
        data: {
          name: "Other",
          permissions: ["read:basic"]
        }
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordPlain, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email: cleanEmail,
        passwordHash,
        roleId: role.id
      },
      include: {
        role: true
      }
    });

    return user;
  }
}

// -------------------------------------------------------------
// INVOICE SERVICES (Super Admin Exclusive)
// -------------------------------------------------------------

export async function listInvoices(filters?: { status?: string; clientId?: string; search?: string }): Promise<any[]> {
  await checkDbConnection();

  if (isMockMode) {
    let result = mockDb.invoices.map(inv => {
      const client = mockDb.clients.find(c => c.id === inv.clientId);
      const items = mockDb.invoiceItems.filter(item => item.invoiceId === inv.id);
      return {
        ...inv,
        client,
        items
      };
    });

    if (filters?.status) {
      result = result.filter(inv => inv.status.toLowerCase() === filters.status!.toLowerCase());
    }
    if (filters?.clientId) {
      result = result.filter(inv => inv.clientId === filters.clientId);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(inv => 
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.client?.name.toLowerCase().includes(q) ||
        inv.placeOfSupply.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.search) {
      const q = filters.search;
      where.OR = [
        { invoiceNumber: { contains: q, mode: "insensitive" } },
        { client: { name: { contains: q, mode: "insensitive" } } },
        { placeOfSupply: { contains: q, mode: "insensitive" } }
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: true,
        items: true,
        createdBy: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return invoices;
  }
}

export async function getInvoiceById(id: string): Promise<any | null> {
  await checkDbConnection();

  if (isMockMode) {
    const inv = mockDb.invoices.find(i => i.id === id || i.invoiceNumber === id);
    if (!inv) return null;
    const client = mockDb.clients.find(c => c.id === inv.clientId);
    const items = mockDb.invoiceItems.filter(item => item.invoiceId === inv.id);
    const createdBy = mockDb.users.find(u => u.id === inv.createdById);
    return {
      ...inv,
      client,
      items,
      createdBy
    };
  } else {
    const invoice = await prisma.invoice.findFirst({
      where: {
        OR: [{ id }, { invoiceNumber: id }]
      },
      include: {
        client: true,
        items: true,
        createdBy: { select: { id: true, name: true, email: true } }
      }
    });

    return invoice;
  }
}

export async function getNextInvoiceNumber(): Promise<string> {
  await checkDbConnection();

  if (isMockMode) {
    const count = mockDb.invoices.length + 88;
    return `PI-${String(count).padStart(6, "0")}`;
  } else {
    const count = await prisma.invoice.count();
    const nextNum = count + 88;
    return `PI-${String(nextNum).padStart(6, "0")}`;
  }
}

export async function createInvoice(data: any, userId: string): Promise<any> {
  await checkDbConnection();

  const invoiceNumber = data.invoiceNumber || await getNextInvoiceNumber();
  const items = data.items && Array.isArray(data.items) ? data.items : [];

  let subtotal = 0;
  let taxTotal = 0;

  const processedItems = items.map((item: any, idx: number) => {
    const qty = parseFloat(item.quantity) || 1;
    const rate = parseFloat(item.rate) || 0;
    const lineAmount = qty * rate;
    const taxRate = parseFloat(item.taxRate) || (item.taxName?.includes("18%") ? 18 : item.taxName?.includes("12%") ? 12 : item.taxName?.includes("5%") ? 5 : 0);
    const lineTax = (lineAmount * taxRate) / 100;

    subtotal += lineAmount;
    taxTotal += lineTax;

    return {
      id: `item-${Date.now()}-${idx}`,
      itemDetails: item.itemDetails || "Service Item",
      description: item.description || "",
      sacCode: item.sacCode || "998314",
      quantity: qty,
      rate,
      taxName: item.taxName || (taxRate > 0 ? `IGST${taxRate} [${taxRate}%]` : "Non-Taxable [0%]"),
      taxRate,
      amount: lineAmount
    };
  });

  const totalAmount = subtotal + taxTotal;

  if (isMockMode) {
    const newInvoice: any = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      clientId: data.clientId || null,
      companyName: data.companyName || "Pixxelu Digital Technology",
      companyAddress: data.companyAddress || "Building no 256, Dharamshala\nkangra Himachal Pradesh 176215\nIndia",
      companyPhone: data.companyPhone || "9218000707",
      companyEmail: data.companyEmail || "rakeshrinku16@gmail.com",
      companyWebsite: data.companyWebsite || "www.pixxelu.com",
      companyGstin: data.companyGstin || "02ABBFP9262H1ZA",
      companyPan: data.companyPan || "ABBFP9262H",
      customerName: data.customerName || "",
      customerEmail: data.customerEmail || "",
      customerCompany: data.customerCompany || "",
      customerAddress: data.customerAddress || "",
      placeOfSupply: data.placeOfSupply || "Haryana (06)",
      gstTreatment: data.gstTreatment || "Registered Business - Regular",
      gstin: data.gstin || "",
      invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
      dueDate: data.dueDate ? new Date(data.dueDate) : new Date(),
      paymentTerms: data.paymentTerms || "Due on Receipt",
      currency: data.currency || "INR",
      subtotal,
      taxTotal,
      totalAmount,
      totalInWords: data.totalInWords || "",
      bankName: data.bankName || "Bank of Baroda",
      accountNumber: data.accountNumber || "10520200000277",
      ifscCode: data.ifscCode || "BARB0DHAKAN",
      accountHolder: data.accountHolder || "Pixxelu Digital Technology",
      invoiceIncludes: data.invoiceIncludes || "• Remaining payment for the original approved project.\n• Additional charges for the expanded scope of work requested during project execution.",
      customerNotes: data.customerNotes || "Thank you for your business.",
      termsAndConditions: data.termsAndConditions || "",
      signatoryText: data.signatoryText || "For Pixxelu Digital Technology\nPartner",
      status: data.status || "Draft",
      createdById: userId,
      items: processedItems,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockDb.invoices.push(newInvoice);
    processedItems.forEach((pi: any) => {
      mockDb.invoiceItems.push({ ...pi, invoiceId: newInvoice.id, createdAt: new Date() });
    });

    return newInvoice;
  } else {
    const created = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId: data.clientId || null,
        companyName: data.companyName || "Pixxelu Digital Technology",
        companyAddress: data.companyAddress || "Building no 256, Dharamshala\nkangra Himachal Pradesh 176215\nIndia",
        companyPhone: data.companyPhone || "9218000707",
        companyEmail: data.companyEmail || "rakeshrinku16@gmail.com",
        companyWebsite: data.companyWebsite || "www.pixxelu.com",
        companyGstin: data.companyGstin || "02ABBFP9262H1ZA",
        companyPan: data.companyPan || "ABBFP9262H",
        customerName: data.customerName || "",
        customerEmail: data.customerEmail || "",
        customerCompany: data.customerCompany || "",
        customerAddress: data.customerAddress || "",
        placeOfSupply: data.placeOfSupply || "Haryana (06)",
        gstTreatment: data.gstTreatment || "Registered Business - Regular",
        gstin: data.gstin || "",
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate) : new Date(),
        paymentTerms: data.paymentTerms || "Due on Receipt",
        currency: data.currency || "INR",
        subtotal,
        taxTotal,
        totalAmount,
        totalInWords: data.totalInWords || "",
        bankName: data.bankName || "Bank of Baroda",
        accountNumber: data.accountNumber || "10520200000277",
        ifscCode: data.ifscCode || "BARB0DHAKAN",
        accountHolder: data.accountHolder || "Pixxelu Digital Technology",
        invoiceIncludes: data.invoiceIncludes || "• Remaining payment for the original approved project.\n• Additional charges for the expanded scope of work requested during project execution.",
        customerNotes: data.customerNotes || "Thank you for your business.",
        termsAndConditions: data.termsAndConditions || "",
        signatoryText: data.signatoryText || "For Pixxelu Digital Technology\nPartner",
        status: data.status || "Draft",
        createdById: userId,
        items: {
          create: processedItems.map((item: any) => ({
            itemDetails: item.itemDetails,
            description: item.description,
            sacCode: item.sacCode,
            quantity: item.quantity,
            rate: item.rate,
            taxName: item.taxName,
            taxRate: item.taxRate,
            amount: item.amount
          }))
        }
      },
      include: {
        client: true,
        items: true,
        createdBy: { select: { id: true, name: true, email: true } }
      }
    });

    return created;
  }
}

export async function updateInvoice(id: string, data: any): Promise<any> {
  await checkDbConnection();

  const items = data.items && Array.isArray(data.items) ? data.items : [];
  let subtotal = 0;
  let taxTotal = 0;

  const processedItems = items.map((item: any, idx: number) => {
    const qty = parseFloat(item.quantity) || 1;
    const rate = parseFloat(item.rate) || 0;
    const lineAmount = qty * rate;
    const taxRate = parseFloat(item.taxRate) || (item.taxName?.includes("18%") ? 18 : item.taxName?.includes("12%") ? 12 : item.taxName?.includes("5%") ? 5 : 0);
    const lineTax = (lineAmount * taxRate) / 100;

    subtotal += lineAmount;
    taxTotal += lineTax;

    return {
      id: item.id || `item-${Date.now()}-${idx}`,
      itemDetails: item.itemDetails || "Service Item",
      description: item.description || "",
      sacCode: item.sacCode || "998314",
      quantity: qty,
      rate,
      taxName: item.taxName || (taxRate > 0 ? `IGST${taxRate} [${taxRate}%]` : "Non-Taxable [0%]"),
      taxRate,
      amount: lineAmount
    };
  });

  const totalAmount = subtotal + taxTotal;

  if (isMockMode) {
    const index = mockDb.invoices.findIndex(i => i.id === id);
    if (index === -1) throw new Error("Invoice not found");

    const updated = {
      ...mockDb.invoices[index],
      ...data,
      subtotal,
      taxTotal,
      totalAmount,
      items: processedItems,
      updatedAt: new Date()
    };
    mockDb.invoices[index] = updated;

    // replace items in mock
    mockDb.invoiceItems = mockDb.invoiceItems.filter(i => i.invoiceId !== id);
    processedItems.forEach((pi: any) => {
      mockDb.invoiceItems.push({ ...pi, invoiceId: id, createdAt: new Date() });
    });

    return updated;
  } else {
    // Delete old items and insert updated items in a transaction
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: id }
    });

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        clientId: data.clientId !== undefined ? (data.clientId || null) : undefined,
        companyName: data.companyName,
        companyAddress: data.companyAddress,
        companyPhone: data.companyPhone,
        companyEmail: data.companyEmail,
        companyWebsite: data.companyWebsite,
        companyGstin: data.companyGstin,
        companyPan: data.companyPan,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerCompany: data.customerCompany,
        customerAddress: data.customerAddress,
        placeOfSupply: data.placeOfSupply,
        gstTreatment: data.gstTreatment,
        gstin: data.gstin,
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        paymentTerms: data.paymentTerms,
        currency: data.currency,
        subtotal,
        taxTotal,
        totalAmount,
        totalInWords: data.totalInWords,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode,
        accountHolder: data.accountHolder,
        invoiceIncludes: data.invoiceIncludes,
        customerNotes: data.customerNotes,
        termsAndConditions: data.termsAndConditions,
        signatoryText: data.signatoryText,
        status: data.status,
        items: {
          create: processedItems.map((item: any) => ({
            itemDetails: item.itemDetails,
            description: item.description,
            sacCode: item.sacCode,
            quantity: item.quantity,
            rate: item.rate,
            taxName: item.taxName,
            taxRate: item.taxRate,
            amount: item.amount
          }))
        }
      },
      include: {
        client: true,
        items: true,
        createdBy: { select: { id: true, name: true, email: true } }
      }
    });

    return updated;
  }
}

export async function deleteInvoice(id: string): Promise<boolean> {
  await checkDbConnection();

  if (isMockMode) {
    mockDb.invoices = mockDb.invoices.filter(i => i.id !== id);
    mockDb.invoiceItems = mockDb.invoiceItems.filter(i => i.invoiceId !== id);
    return true;
  } else {
    await prisma.invoice.delete({
      where: { id }
    });
    return true;
  }
}

