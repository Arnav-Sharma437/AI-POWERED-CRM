import { NextResponse } from "next/server";
import { enrichLinkedInProfile } from "@/lib/services";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "URL query parameter is required" }, { status: 400 });
    }

    const profile = await enrichLinkedInProfile(url);
    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("Enrichment API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
