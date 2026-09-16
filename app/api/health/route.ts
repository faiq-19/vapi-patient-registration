import { NextResponse } from "next/server";
import { db } from "@/lib/core";

export async function GET() {
  try {
    const { error } = await db().from("patients").select("patient_id", { count: "exact", head: true });
    if (error) throw error;
    return NextResponse.json({ data: { status: "ok", database: "connected" }, error: null });
  } catch (error) {
    console.error("GET /api/health", error);
    return NextResponse.json(
      { data: null, error: "Database connection failed" },
      { status: 500 }
    );
  }
}
