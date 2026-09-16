import { NextResponse } from "next/server";
import { db, patientSchema, validationError } from "@/lib/core";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let query = db().from("patients").select("*").is("deleted_at", null).order("created_at", { ascending: false });

    const lastName = searchParams.get("last_name");
    const dob = searchParams.get("date_of_birth");
    const phone = searchParams.get("phone_number")?.replace(/\D/g, "");
    if (lastName) query = query.ilike("last_name", lastName);
    if (dob) query = query.eq("date_of_birth", dob);
    if (phone) query = query.eq("phone_number", phone);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data, error: null });
  } catch (error) {
    console.error("GET /api/patients", error);
    return NextResponse.json({ data: null, error: "Unable to fetch patients" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const parsed = patientSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: validationError(parsed.error) }, { status: 422 });
    }

    console.log("patient_registration_payload", parsed.data);
    const { data, error } = await db().from("patients").insert(parsed.data).select().single();
    if (error) throw error;
    return NextResponse.json({ data, error: null }, { status: 201 });
  } catch (error) {
    console.error("POST /api/patients", error);
    return NextResponse.json({ data: null, error: "Unable to create patient" }, { status: 500 });
  }
}
