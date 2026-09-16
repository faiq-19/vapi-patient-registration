# CareCloud Voice AI Patient Registration

A small end-to-end implementation for the CareCloud AI Engineer take-home assessment.

## Live Demo

- App / Dashboard: https://vapi-patient-registration.vercel.app/
- Voice Agent: +1 (586) 221-9236
- API Base URL: https://vapi-patient-registration.vercel.app

The reviewer can open the app link, call the voice agent, refresh the dashboard, and verify that the patient was persisted.

## Stack

- Vapi — phone number, STT/TTS, voice conversation
- Next.js + TypeScript — REST API and reviewer dashboard
- Supabase PostgreSQL — persistent patient records
- Vercel — hosting

## Architecture

`Caller → Vapi → Next.js REST API → Supabase`

The same Next.js deployment serves the dashboard, so the reviewer only needs one web link plus the phone call button shown on that page.

## API

- `GET /patients` — list/search (`last_name`, `date_of_birth`, `phone_number`)
- `POST /patients` — create
- `GET /patients/:id` — retrieve
- `PUT /patients/:id` — partial update
- `DELETE /patients/:id` — soft delete

Responses use `{ "data": ..., "error": null }` on success. Inputs are validated server-side with Zod and the final registration payload is logged by the backend.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Required environment variables:

```env
SUPABASE_URL=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_VAPI_PHONE_NUMBER=+15862219236
```

`SUPABASE_SECRET_KEY` is server-only. Do not prefix it with `NEXT_PUBLIC_` or commit it.

## Vapi

The live system keeps the original working Vapi assistant and `create_patient` function tool. The only backend change is the tool server URL:

`https://vapi-patient-registration.vercel.app/patients`

See `vapi/SETUP.md` for the minimal configuration change.

## Notes

- Technical assessment only. Do not enter real PHI.
- Supabase RLS is enabled; the server uses a secret/service credential.
- The dashboard includes a clearly fake demo-patient button for quick persistence testing.
- The implementation intentionally stays small rather than adding unnecessary queues, auth layers, or orchestration services.
