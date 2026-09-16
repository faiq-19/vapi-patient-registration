import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export function db() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SECRET_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const states = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"
]);

const phone = z.string().transform(v => v.replace(/\D/g, "")).pipe(z.string().regex(/^\d{10}$/, "Must be a valid 10-digit US phone number"));
const name = z.string().trim().min(1).max(50).regex(/^[A-Za-zÀ-ÿ'-]+$/, "Invalid name");
const dob = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d && date <= new Date();
}, "Invalid or future date of birth");

export const patientSchema = z.object({
  first_name: name,
  last_name: name,
  date_of_birth: dob,
  sex: z.enum(["Male", "Female", "Other", "Decline to Answer"]),
  phone_number: phone,
  email: z.union([z.string().email(), z.literal(""), z.null()]).optional().transform(v => v || null),
  address_line_1: z.string().trim().min(1).max(255),
  address_line_2: z.string().trim().max(255).nullish(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().toUpperCase().refine(v => states.has(v), "Invalid US state abbreviation"),
  zip_code: z.string().trim().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
  insurance_provider: z.string().trim().max(150).nullish(),
  insurance_member_id: z.string().trim().max(100).nullish(),
  preferred_language: z.string().trim().max(50).nullish(),
  emergency_contact_name: z.string().trim().max(150).nullish(),
  emergency_contact_phone: z.union([phone, z.literal(""), z.null()]).optional().transform(v => v || null),
});

export const patientUpdateSchema = patientSchema.partial();

export function validationError(error: z.ZodError) {
  return error.issues.map(i => ({ field: i.path.join("."), message: i.message }));
}
