// In-memory fallback database for BDA CRM

export interface Role {
  id: string;
  name: string;
  permissions: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // bcrypt hash for 'password123'
  roleId: string;
  isActive?: boolean;
  isTrashed?: boolean;
  createdAt: Date;
}

export interface Lead {
  id: string;
  name: string;
  linkedinUrl: string;
  profilePhoto?: string;
  country?: string;
  city?: string;
  jobTitle?: string;
  company?: string;
  industry?: string;
  serviceRequirements: string[];
  customServiceRequirement?: string;
  leadSource: string;
  customLeadSource?: string;
  status: string;
  priority: string;
  primaryBdaId?: string;
  assignedBdaIds: string[]; // secondary assignments
  tags: string[];
  notes?: string;
  lastContacted?: Date;
  nextFollowup?: Date;
  followupNotes?: string;
  isTrashed: boolean;
  convertedAt?: Date;
  convertedClientId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  company?: string;
  industry?: string;
  logo?: string;
  phone?: string;
  website?: string;
  isTrashed: boolean;
  leadId?: string;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  source?: string;
  startDate: Date;
  deadline: Date;
  finalBudget: number;
  bonus: number;
  primaryBdaId: string;
  serviceType: string;
  status: string;
  currency?: string; // "INR" | "USD" | "EUR" | "GBP" | "AED" | "CAD" | "AUD"
  pricingModel?: string; // "Fixed" | "Hourly"
  hourlyRate?: number;
  estimatedHours?: number;
  issueDescription?: string;
  notes?: string;
  closeOutcome?: string; // "Good" | "Bad" | "Neutral"
  clientRating?: number; // 1 to 5
  clientFeedback?: string;
  isTrashed: boolean;
  createdAt: Date;
}

export interface ProjectOwnershipHistory {
  id: string;
  projectId: string;
  previousBdaId?: string;
  newBdaId: string;
  takeoverDate: Date;
  note?: string;
}

export interface Payment {
  id: string;
  amount: number;
  paymentDate: Date;
  note?: string;
  projectId: string;
  recordedById: string;
  createdAt: Date;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  fileType: string;
  size: number;
  uploadedById: string;
  leadId?: string;
  projectId?: string;
  createdAt: Date;
}

export interface Activity {
  id: string;
  timestamp: Date;
  userId: string;
  type: string;
  notes: string;
  leadId?: string;
  projectId?: string;
  clientId?: string;
}

export interface Meeting {
  id: string;
  title: string;
  type: string;
  startTime: Date;
  endTime?: Date;
  status: string;
  notes?: string;
  leadId?: string;
  projectId?: string;
  assignedUserIds: string[];
  createdAt: Date;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  userId: string;
  linkUrl?: string;
  createdAt: Date;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  itemDetails: string;
  description?: string;
  sacCode?: string;
  quantity: number;
  rate: number;
  taxName?: string;
  taxRate: number;
  amount: number;
  createdAt: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId?: string;
  client?: Client;
  customerName?: string;
  customerEmail?: string;
  customerCompany?: string;
  placeOfSupply: string;
  gstTreatment?: string;
  gstin?: string;
  invoiceDate: Date;
  dueDate: Date;
  paymentTerms: string;
  currency: string;
  subtotal: number;
  taxTotal: number;
  totalAmount: number;
  customerNotes?: string;
  termsAndConditions?: string;
  status: string; // Draft, Sent, Paid, Overdue, Cancelled
  createdById: string;
  items: InvoiceItem[];
  createdAt: Date;
  updatedAt: Date;
}

// Global In-Memory Store
class MockDatabase {
  roles: Role[] = [];
  users: User[] = [];
  leads: Lead[] = [];
  clients: Client[] = [];
  projects: Project[] = [];
  ownershipHistory: ProjectOwnershipHistory[] = [];
  payments: Payment[] = [];
  attachments: Attachment[] = [];
  activities: Activity[] = [];
  meetings: Meeting[] = [];
  notifications: Notification[] = [];
  invoices: Invoice[] = [];
  invoiceItems: InvoiceItem[] = [];

  constructor() {
    this.seed();
  }

  seed() {
    // Roles
    this.roles = [
      { id: "r1", name: "Super Admin", permissions: ["all"] },
      { id: "r2", name: "BDA", permissions: ["leads", "clients", "projects", "calendar", "activities", "trash"] },
      { id: "r3", name: "Developer", permissions: ["projects", "calendar"] },
      { id: "r4", name: "Other", permissions: ["basic"] }
    ];

    // Users
    // passwordHash is for 'password123'
    const defaultHash = "$2a$10$w4rI9z/UqX5K084a95l0du56N.5bW7.kMtfp7o/eRswJ1i4W3W4D2"; 
    
    const bdaNames = ["Varun", "Arnav", "Ankit", "Naveen", "Rakesh"];
    bdaNames.forEach((name, idx) => {
      this.users.push({
        id: `u-bda-${idx + 1}`,
        name,
        email: `${name.toLowerCase()}@bda.com`,
        passwordHash: defaultHash,
        roleId: name === "Varun" ? "r1" : "r2",
        createdAt: new Date()
      });
    });

    const otherNames = ["Atul", "Rajesh", "Anku", "Rahul", "Bittu", "Rohit", "Mukesh", "Goldi"];
    otherNames.forEach((name, idx) => {
      this.users.push({
        id: `u-dev-${idx + 1}`,
        name,
        email: `${name.toLowerCase()}@bda.com`,
        passwordHash: defaultHash,
        roleId: "r3",
        createdAt: new Date()
      });
    });

    // Mock Leads
    this.leads = [
      {
        id: "l1",
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
        primaryBdaId: "u-bda-1", // Varun
        assignedBdaIds: [],
        tags: ["Shopify", "High Budget", "USA"],
        notes: "Highly interested in redesigning their Shopify storefront. Budget looks high.",
        nextFollowup: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
        followupNotes: "Share portfolio on Shopify store redesigns.",
        isTrashed: false,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        id: "l2",
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
        primaryBdaId: "u-bda-2", // Arnav
        assignedBdaIds: ["u-bda-3"], // Ankit
        tags: ["Decision Maker", "Urgent"],
        notes: "Wants a mobile app design for cyber security monitoring. Meeting scheduled.",
        nextFollowup: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        followupNotes: "Prepare proposal draft.",
        isTrashed: false,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: "l3",
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
        primaryBdaId: "u-bda-3", // Ankit
        assignedBdaIds: [],
        tags: ["Repeat Client"],
        notes: "Referred by Rajesh. Needs a custom warehouse tracking system.",
        nextFollowup: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        followupNotes: "First touchpoint call.",
        isTrashed: false,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ];

    // Seed default activities
    this.leads.forEach(lead => {
      this.activities.push({
        id: `act-${lead.id}-init`,
        timestamp: lead.createdAt,
        userId: lead.primaryBdaId || "u-bda-1",
        type: "LinkedIn",
        notes: "Created lead from LinkedIn profile URL.",
        leadId: lead.id
      });
    });

    // Mock Meetings
    this.meetings = [
      {
        id: "m1",
        title: "Intro Call: TechGrow Solutions",
        type: "Call",
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        endTime: new Date(Date.now() + 2.5 * 60 * 60 * 1000),
        status: "Upcoming",
        notes: "First introduction call with John Smith.",
        leadId: "l1",
        assignedUserIds: ["u-bda-1"],
        createdAt: new Date()
      },
      {
        id: "m2",
        title: "UI/UX Kickoff: Cyberdyne App",
        type: "Meeting",
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
        endTime: new Date(Date.now() - 23.5 * 60 * 60 * 1000),
        status: "Completed",
        notes: "Reviewed wireframes. Client approved the dark mode direction.",
        leadId: "l2",
        assignedUserIds: ["u-bda-2", "u-bda-3"],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    ];

    // Connect m2 completed activity
    this.activities.push({
      id: "act-m2-complete",
      timestamp: new Date(Date.now() - 23.5 * 60 * 60 * 1000),
      userId: "u-bda-2",
      type: "Meeting",
      notes: "Meeting completed: UI/UX Kickoff: Cyberdyne App. Approved dark mode wireframes.",
      leadId: "l2"
    });

    // Mock Notifications
    this.notifications = [
      {
        id: "n1",
        title: "Meeting in 2 hours",
        message: "You have an Intro Call with John Smith in 2 hours.",
        type: "MeetingReminder",
        isRead: false,
        userId: "u-bda-1",
        linkUrl: "/dashboard/leads/l1",
        createdAt: new Date()
      },
      {
        id: "n2",
        title: "New Lead Assigned",
        message: "Sarah Connor has been assigned to you as an additional BDA.",
        type: "NewLead",
        isRead: false,
        userId: "u-bda-3",
        linkUrl: "/dashboard/leads/l2",
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
      }
    ];

    // Seed Initial Mock Invoice matching reference design
    const seedInvoiceItems: InvoiceItem[] = [
      {
        id: "inv-item-1",
        invoiceId: "inv-1",
        itemDetails: "Additional Website Development Charges",
        description: "(Including additional pages, scope expansion, UI/UX revisions, redesign iterations, responsive implementation and testing.)",
        sacCode: "998314",
        quantity: 1,
        rate: 15000,
        taxName: "IGST18 [18%]",
        taxRate: 18,
        amount: 15000,
        createdAt: new Date()
      }
    ];

    this.invoices = [
      {
        id: "inv-1",
        invoiceNumber: "PI-000088",
        clientId: "c1",
        placeOfSupply: "[HR] - Haryana",
        gstTreatment: "Registered Business - Regular",
        gstin: "06AAKCT4257D1ZC",
        invoiceDate: new Date("2026-08-07"),
        dueDate: new Date("2026-08-07"),
        paymentTerms: "Due on Receipt",
        currency: "INR",
        subtotal: 15000,
        taxTotal: 2700,
        totalAmount: 17700,
        customerNotes: "Thanks for your business. Please remit payment at your earliest convenience.",
        termsAndConditions: "1. All disputes subject to local jurisdiction.\n2. Interest @ 18% p.a. charged on overdue payments.",
        status: "Draft",
        createdById: "u-bda-1",
        items: seedInvoiceItems,
        createdAt: new Date("2026-08-07"),
        updatedAt: new Date("2026-08-07")
      }
    ];
    this.invoiceItems = seedInvoiceItems;
  }
}

// Make database global to persist in-memory in dev server
const globalForMock = global as unknown as { mockDb: MockDatabase };
export const mockDb = globalForMock.mockDb || new MockDatabase();
if (process.env.NODE_ENV !== "production") globalForMock.mockDb = mockDb;
