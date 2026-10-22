import { NextResponse } from "next/server";
import { pgQuery } from "@/lib/server/pg-db";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  try {
    // Lightweight database query that resets Supabase's 7-day inactivity pause counter
    await pgQuery("SELECT 1 AS alive");
    const durationMs = Date.now() - start;

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
      latencyMs: durationMs,
      services: {
        api: "operational",
        database: "operational",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "degraded",
        timestamp: new Date().toISOString(),
        database: "error",
        error: error.message || "Database connection failed",
      },
      { status: 503 }
    );
  }
}
