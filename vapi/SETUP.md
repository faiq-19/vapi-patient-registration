# Vapi setup

Keep the existing Vapi phone number and assistant. Replace the old n8n tool URLs with Vapi **API Request** tools pointing to the live Vercel deployment.

1. `lookup_patient` — GET `https://vapi-patient-registration.vercel.app/api/patients?phone_number=<phone_number>`
2. `create_patient` — POST `https://vapi-patient-registration.vercel.app/api/patients` with the collected patient JSON body.
3. `update_patient` — PUT `https://vapi-patient-registration.vercel.app/api/patients/<patient_id>` with only corrected fields.

Use the instructions in `system-prompt.md` as the assistant system prompt. Configure tool failure messaging so the assistant tells the caller the save failed instead of pretending it succeeded.

Vapi's API Request tool is intentionally used here because the backend already exposes ordinary REST endpoints; a separate Vapi webhook adapter would add code without adding value for this assessment.
