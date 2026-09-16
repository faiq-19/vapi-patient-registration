import { NextResponse } from "next/server";
import { db, patientUpdateSchema, validationError } from "@/lib/core";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  const { id } = await params;
  const { data, error } = await db().from("patients").select("*").eq("patient_id", id).is("deleted_at", null).maybeSingle();
  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ data: null, error: "Patient not found" }, { status: 404 });
  return NextResponse.json({ data, error: null });
}

export async function PUT(request: Request, { params }: Context) {
  const { id } = await params;
  const parsed = patientUpdateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ data: null, error: validationError(parsed.error) }, { status: 422 });
  if (Object.keys(parsed.data).length === 0) return NextResponse.json({ data: null, error: "No fields to update" }, { status: 400 });

  const { data, error } = await db().from("patients")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("patient_id", id).is("deleted_at", null).select().maybeSingle();

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ data: null, error: "Patient not found" }, { status: 404 });
  return NextResponse.json({ data, error: null });
}

export async function DELETE(_: Request, { params }: Context) {
  const { id } = await params;
  const now = new Date().toISOString();
  const { data, error } = await db().from("patients")
    .update({ deleted_at: now, updated_at: now })
    .eq("patient_id", id).is("deleted_at", null).select("patient_id").maybeSingle();

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ data: null, error: "Patient not found" }, { status: 404 });
  return NextResponse.json({ data, error: null });
}
