import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // 1. Create Roles
  const rolesData = [
    { name: "Super Admin", permissions: ["all"] },
    { name: "BDA", permissions: ["leads:read", "leads:write", "clients:read", "clients:write", "projects:read", "projects:write", "calendar:read", "activities:read", "trash:read"] },
    { name: "Developer", permissions: ["projects:read", "calendar:read"] },
    { name: "Other", permissions: ["read:basic"] }
  ];

  const roles: Record<string, any> = {};
  for (const r of rolesData) {
    roles[r.name] = await prisma.role.upsert({
      where: { name: r.name },
      update: { permissions: r.permissions },
      create: { name: r.name, permissions: r.permissions },
    });
  }
  console.log("Roles seeded successfully.");

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("password123", salt);

  // 2. Create Users
  const bdaTeam = ["Varun", "Arnav", "Ankit", "Naveen", "Rakesh"];
  const otherTeam = [
    { name: "Atul", role: "Developer" },
    { name: "Rajesh", role: "Developer" },
    { name: "Anku", role: "Developer" },
    { name: "Rahul", role: "Developer" },
    { name: "Bittu", role: "Developer" },
    { name: "Rohit", role: "Developer" },
    { name: "Mukesh", role: "Developer" },
    { name: "Goldi", role: "Developer" }
  ];

  const seededUsers = [];

  // Seed BDA users (Varun is Super Admin, rest are BDA)
  for (const name of bdaTeam) {
    const roleName = name === "Varun" ? "Super Admin" : "BDA";
    const email = `${name.toLowerCase()}@bda.com`;
    const user = await prisma.user.upsert({
      where: { email },
      update: { roleId: roles[roleName].id },
      create: {
        name,
        email,
        passwordHash,
        roleId: roles[roleName].id,
      },
    });
    seededUsers.push(user);
  }

  // Seed Other users (Developers)
  for (const member of otherTeam) {
    const email = `${member.name.toLowerCase()}@bda.com`;
    const user = await prisma.user.upsert({
      where: { email },
      update: { roleId: roles[member.role].id },
      create: {
        name: member.name,
        email,
        passwordHash,
        roleId: roles[member.role].id,
      },
    });
    seededUsers.push(user);
  }

  console.log("Users seeded successfully.");

  // 3. Seed some mock Leads for demonstration
  const bdaUserIds = seededUsers.filter(u => bdaTeam.includes(u.name)).map(u => u.id);
  
  if (bdaUserIds.length > 0) {
    const mockLeads = [
      {
        name: "John Smith",
        linkedinUrl: "https://linkedin.com/in/johnsmith-demo-1",
        profilePhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        country: "United States",
        city: "San Francisco",
        jobTitle: "Founder & CEO",
        company: "TechGrow Solutions",
        industry: "Information Technology",
        serviceRequirements: ["Shopify", "Web Design"],
        leadSource: "LinkedIn",
        status: "Interested",
        priority: "Hot",
        primaryBdaId: bdaUserIds[0], // Varun
        notes: "Highly interested in redesigning their Shopify storefront. Budget looks high.",
        tags: ["Shopify", "High Budget", "USA"],
        nextFollowup: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
        followupNotes: "Share portfolio on Shopify store redesigns."
      },
      {
        name: "Sarah Connor",
        linkedinUrl: "https://linkedin.com/in/sarahconnor-demo-2",
        profilePhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
        country: "United Kingdom",
        city: "London",
        jobTitle: "VP of Product",
        company: "Cyberdyne Systems",
        industry: "Artificial Intelligence",
        serviceRequirements: ["UI/UX", "Mobile App"],
        leadSource: "Upwork",
        status: "Meeting",
        priority: "Hot",
        primaryBdaId: bdaUserIds[1], // Arnav
        notes: "Wants a mobile app design for cyber security monitoring. Meeting scheduled.",
        tags: ["Decision Maker", "Urgent"],
        nextFollowup: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        followupNotes: "Prepare proposal draft."
      },
      {
        name: "Amit Patel",
        linkedinUrl: "https://linkedin.com/in/amitpatel-demo-3",
        profilePhoto: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
        country: "India",
        city: "Mumbai",
        jobTitle: "Operations Manager",
        company: "Apt Logistics",
        industry: "Logistics",
        serviceRequirements: ["Custom Software"],
        leadSource: "Referral",
        status: "New",
        priority: "Warm",
        primaryBdaId: bdaUserIds[2], // Ankit
        notes: "Referred by Rajesh. Needs a custom warehouse tracking system.",
        tags: ["Repeat Client"],
        nextFollowup: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        followupNotes: "First touchpoint call."
      }
    ];

    for (const lead of mockLeads) {
      await prisma.lead.upsert({
        where: { linkedinUrl: lead.linkedinUrl },
        update: {},
        create: {
          name: lead.name,
          linkedinUrl: lead.linkedinUrl,
          profilePhoto: lead.profilePhoto,
          country: lead.country,
          city: lead.city,
          jobTitle: lead.jobTitle,
          company: lead.company,
          industry: lead.industry,
          serviceRequirements: lead.serviceRequirements,
          leadSource: lead.leadSource,
          status: lead.status,
          priority: lead.priority,
          primaryBdaId: lead.primaryBdaId,
          notes: lead.notes,
          tags: lead.tags,
          nextFollowup: lead.nextFollowup,
          followupNotes: lead.followupNotes,
          activities: {
            create: [
              {
                userId: lead.primaryBdaId,
                type: "LinkedIn",
                notes: `Created lead from LinkedIn profile url.`
              }
            ]
          }
        }
      });
    }
    console.log("Mock Leads seeded successfully.");
  }

  console.log("Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
