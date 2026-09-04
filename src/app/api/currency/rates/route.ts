import { NextResponse } from "next/server";
import { getLiveExchangeRates, FALLBACK_RATES_TO_INR } from "@/lib/currency";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rates = await getLiveExchangeRates();
    return NextResponse.json({
      success: true,
      base: "INR",
      ratesToInr: rates,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      base: "INR",
      ratesToInr: FALLBACK_RATES_TO_INR,
      fallback: true
    });
  }
}
