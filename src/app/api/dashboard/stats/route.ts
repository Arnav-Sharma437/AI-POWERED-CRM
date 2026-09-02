import { NextResponse } from "next/server";
import { checkDbConnection, isDemoMode, listLeads, listProjects, listMeetings, listActivities, listUsers } from "@/lib/services";
import { mockDb } from "@/lib/mockData";

export async function GET() {
  try {
    await checkDbConnection();

    const leads = await listLeads();
    const projects = await listProjects();
    const meetings = await listMeetings();
    const activities = await listActivities();
    const users = await listUsers();

    // 1. KPI Calculations
    const totalLeads = leads.length;
    const hotLeads = leads.filter(l => l.priority === "Hot" && l.status !== "Won" && l.status !== "Lost").length;
    
    // Today's boundaries
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    const endOfToday = new Date();
    endOfToday.setHours(23,59,59,999);

    const meetingsToday = meetings.filter(m => {
      const date = new Date(m.startTime);
      return date >= startOfToday && date <= endOfToday && m.status !== "Cancelled";
    }).length;

    const followupsToday = leads.filter(l => {
      if (!l.nextFollowup) return false;
      const date = new Date(l.nextFollowup);
      return date >= startOfToday && date <= endOfToday && l.status !== "Won" && l.status !== "Lost";
    }).length;

    const activeProjects = projects.filter(p => p.status === "Work in Progress").length;

    // Upcoming deadlines (next 7 days)
    const next7Days = new Date();
    next7Days.setDate(next7Days.getDate() + 7);
    const upcomingDeadlines = projects.filter(p => {
      const date = new Date(p.deadline);
      return date >= startOfToday && date <= next7Days && p.status !== "Completed" && p.status !== "Cancelled";
    }).length;

    const CURRENCY_TO_INR_RATES: Record<string, number> = {
      INR: 1,
      USD: 87.5,
      EUR: 94.0,
      GBP: 110.0,
      AED: 23.8,
      CAD: 63.5,
      AUD: 56.5
    };

    const pendingPaymentsSum = projects.reduce((sum, p) => {
      const pending = p.pendingAmount || 0;
      const curr = (p.currency || "INR").toUpperCase();
      const rate = CURRENCY_TO_INR_RATES[curr] || 1;
      return sum + (pending * rate);
    }, 0);

    // 2. Distributions
    // Lead distribution by status (funnel)
    const funnelStatuses = ["New", "Contacted", "Connected", "Replied", "Interested", "Meeting", "Proposal Sent", "Won", "Lost"];
    const leadFunnel = funnelStatuses.map(status => ({
      status,
      count: leads.filter(l => l.status === status).length
    }));

    // Lead distribution by country
    const countryMap: Record<string, number> = {};
    leads.forEach(l => {
      const country = l.country || "Unknown";
      countryMap[country] = (countryMap[country] || 0) + 1;
    });
    const leadsByCountry = Object.entries(countryMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 5);

    // Lead distribution by service
    const serviceMap: Record<string, number> = {};
    leads.forEach(l => {
      (l.serviceRequirements || []).forEach((s: string) => {
        serviceMap[s] = (serviceMap[s] || 0) + 1;
      });
      if (l.customServiceRequirement) {
        serviceMap[l.customServiceRequirement] = (serviceMap[l.customServiceRequirement] || 0) + 1;
      }
    });
    const leadsByService = Object.entries(serviceMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

    // Lead distribution by BDA
    const bdaMap: Record<string, number> = {};
    leads.forEach(l => {
      const bdaName = l.primaryBda?.name || "Unassigned";
      bdaMap[bdaName] = (bdaMap[bdaName] || 0) + 1;
    });
    const leadsByBda = Object.entries(bdaMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

    // Lists
    const hotLeadsList = leads.filter(l => l.priority === "Hot" && l.status !== "Won" && l.status !== "Lost").slice(0, 5);
    const todayMeetingsList = meetings.filter(m => {
      const date = new Date(m.startTime);
      return date >= startOfToday && date <= endOfToday;
    });
    const todayFollowupsList = leads.filter(l => {
      if (!l.nextFollowup) return false;
      const date = new Date(l.nextFollowup);
      return date >= startOfToday && date <= endOfToday && l.status !== "Won" && l.status !== "Lost";
    });
    const deadlinesList = projects.filter(p => {
      const date = new Date(p.deadline);
      return date >= startOfToday && p.status !== "Completed" && p.status !== "Cancelled";
    }).sort((a,b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()).slice(0, 5);

    const recentProjectsList = projects.slice(0, 5);
    const recentActivityList = activities.slice(0, 7);

    return NextResponse.json({
      success: true,
      stats: {
        kpis: {
          totalLeads,
          hotLeads,
          meetingsToday,
          followupsToday,
          activeProjects,
          upcomingDeadlines,
          pendingPaymentsSum
        },
        distributions: {
          leadFunnel,
          leadsByCountry,
          leadsByService,
          leadsByBda
        },
        lists: {
          hotLeadsList,
          todayMeetingsList,
          todayFollowupsList,
          deadlinesList,
          recentProjectsList,
          recentActivityList,
          teamOverview: users.filter(u => u.roleName === "BDA" || u.roleName === "Super Admin")
        }
      }
    });
  } catch (error) {
    console.error("Dashboard Stats API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
