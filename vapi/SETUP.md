# Vapi setup

Keep the existing Vapi phone number, assistant, prompt, model, transcriber, voice, and existing `create_patient` function tool from the original submission.

Only change the `create_patient` tool server URL from the old n8n webhook to:

`https://vapi-patient-registration.vercel.app/patients`

The tool arguments/JSON schema stay unchanged. The assistant should continue calling `create_patient` only after the caller explicitly confirms all collected information.

The Next.js backend validates the payload, writes the patient to Supabase, and returns a success/error JSON response. If the tool returns an error, the assistant must tell the caller the registration could not be completed and must not claim success.

No additional Vapi tools are required for the core assessment flow.
