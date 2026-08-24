# Voice AI Patient Registration

A voice-based AI patient registration system built for the **CareCloud
AI Engineer Take-Home Technical Assessment**.

The system allows a caller to speak naturally with an AI patient
registration agent, collect required U.S. patient demographic
information, confirm the information, and persist the patient record in
Supabase.

## Live Demo

**Phone Number:** `+1 (586) 221-9236`

**API Base URL:** `https://faiq-codes.app.n8n.cloud`

> The phone number is provisioned through Vapi and routes incoming calls
> to the Patient Registration Agent.

### API Endpoints

  Method     Endpoint                  Description
  ---------- ------------------------- ----------------------------
  `POST`     `/webhook/patients`       Create a patient
  `GET`      `/webhook/patients`       List/search patients
  `GET`      `/webhook/patients/:id`   Retrieve a patient
  `PUT`      `/webhook/patients/:id`   Partially update a patient
  `DELETE`   `/webhook/patients/:id`   Soft-delete a patient

The API returns a consistent JSON envelope:

``` json
{
  "data": {},
  "error": null
}
```

## Architecture

``` text
Caller
  │
  │ Phone call
  ▼
Vapi
  │
  │ Voice conversation
  ▼
Patient Registration Agent
  │
  │ create_patient tool call
  ▼
n8n Cloud REST API
  │
  │ Validation / orchestration
  ▼
Supabase PostgreSQL
  │
  ▼
Persistent Patient Record
```

See [`docs/architecture.md`](docs/architecture.md) for a detailed
architecture description.

## Tech Stack

-   **Vapi** --- Telephony and voice AI orchestration
-   **OpenAI GPT-4.1** --- LLM used by the voice agent
-   **n8n Cloud** --- REST API, validation, orchestration, and database
    integration
-   **Supabase / PostgreSQL** --- Persistent relational database
-   **GitHub** --- Source/configuration management

## Core Flow

1.  A caller dials the Vapi phone number.
2.  Vapi routes the call to the Patient Registration Agent.
3.  The agent collects the required demographic information
    conversationally.
4.  The agent validates information and asks the caller to correct
    invalid fields.
5.  Optional demographic information can be provided if the caller
    chooses.
6.  The agent reads back all collected information.
7.  The agent waits for explicit confirmation.
8.  After confirmation, Vapi invokes the `create_patient` tool.
9.  The tool sends the patient payload to the n8n production webhook.
10. n8n performs server-side validation.
11. The validated record is written to Supabase.
12. The result is returned to Vapi.
13. The agent tells the caller whether registration succeeded or failed.

## Required Patient Fields

The system supports the required fields defined in the assessment:

-   First name
-   Last name
-   Date of birth
-   Sex
-   U.S. phone number
-   Address line 1
-   City
-   State
-   ZIP code

Optional fields:

-   Email
-   Address line 2
-   Insurance provider
-   Insurance member ID
-   Preferred language
-   Emergency contact name
-   Emergency contact phone

Automatically managed fields:

-   `patient_id`
-   `created_at`
-   `updated_at`
-   `deleted_at`

## Validation

Validation is performed server-side in n8n rather than relying only on
the voice agent.

Examples include:

-   Required-field validation
-   Name format validation
-   Date format validation
-   Date-of-birth future-date validation
-   U.S. phone number validation
-   State abbreviation validation
-   ZIP code validation
-   Email validation when supplied

The voice agent also has conversational validation instructions so
invalid information is clarified naturally before submission.

## n8n Workflows

The `n8n/` directory contains the exported workflows used by the REST
API.

Expected workflows:

``` text
n8n/
├── 01-create-patient.json
├── 02-list-patients.json
├── 03-get-patient.json
├── 04-update-patient.json
└── 05-delete-patient.json
```

These workflows can be imported into an n8n instance and connected to
the required Supabase credentials.

## Vapi Configuration

The `vapi/` directory contains configuration/documentation for the voice
agent and its tools.

The primary tool is:

``` text
create_patient
```

It is configured to call:

``` text
POST https://faiq-codes.app.n8n.cloud/webhook/patients
```

The agent is instructed to call this tool only after the caller
explicitly confirms the collected information.

## Database

The project uses Supabase PostgreSQL for persistent storage.

The database schema is documented in:

``` text
database/schema.sql
```

Patient records are persisted independently of n8n execution state, so
data survives workflow/server restarts.

## Setup

### 1. Supabase

Create a Supabase project and create the patient table using the SQL
schema in:

``` text
database/schema.sql
```

Configure the required Supabase credentials in n8n.

### 2. n8n

Import the workflows from the `n8n/` directory.

Configure the Supabase credentials and activate the workflows.

Use the **production webhook URLs**, not n8n test webhook URLs.

### 3. Vapi

Create/configure the Patient Registration Agent.

Configure:

-   LLM provider/model
-   Voice provider/voice
-   Transcriber
-   System prompt
-   `create_patient` function tool

Set the tool server URL to the n8n production webhook.

Assign the Patient Registration Agent to the Vapi phone number under
inbound call settings.

Publish the assistant before testing the live phone number.

## Environment Variables / Secrets

Secrets must not be committed to GitHub.

Typical secrets required by the deployment include:

``` text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
VAPI_API_KEY
OPENAI_API_KEY
```

The exact credentials required depend on which provider credentials are
configured directly inside n8n/Vapi.

## Testing

### Create a patient

Example request:

``` bash
curl -X POST "https://faiq-codes.app.n8n.cloud/webhook/patients" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Smith",
    "date_of_birth": "1995-05-20",
    "sex": "Male",
    "phone_number": "2125551234",
    "email": "john@example.com",
    "address_line_1": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "zip_code": "10001"
  }'
```

### List patients

``` bash
curl "https://faiq-codes.app.n8n.cloud/webhook/patients"
```

### Filter patients

``` bash
curl "https://faiq-codes.app.n8n.cloud/webhook/patients?last_name=Smith"
```

Additional supported filters:

``` text
?date_of_birth=1995-05-20
?phone_number=2125551234
```

## Security Notes

-   API keys and database credentials are stored as secrets rather than
    committed to source control.
-   Server-side validation is performed before database writes.
-   Patient deletion is implemented as a soft delete.
-   This project is a technical assessment and is **not intended for
    real patient/PHI data**.
-   Do not use real patient information when demonstrating the system.

## Known Limitations / Trade-offs

This implementation intentionally prioritizes a working end-to-end
system within the assessment's three-hour time constraint.

Current design trade-offs include:

-   n8n is used as the REST API/orchestration layer instead of a
    conventional FastAPI/Express application.
-   Vapi abstracts telephony, speech-to-text, and text-to-speech
    infrastructure.
-   The dashboard is optional and may be omitted because it is listed as
    a bonus feature in the assessment.
-   Advanced duplicate detection/update flows may be implemented as an
    extension.
-   Production healthcare requirements such as HIPAA compliance, audit
    logging, role-based access control, and enterprise observability are
    outside the scope of this assessment.

## Next Steps

Potential future improvements:

-   Duplicate patient detection by phone number
-   Voice-based update flow for returning patients
-   Patient dashboard
-   Call transcripts linked to patient records
-   Automated API tests
-   Multi-language support
-   Appointment scheduling
-   More comprehensive observability and audit logging

## Repository Structure

``` text
voice-patient-registration/
│
├── README.md
├── .gitignore
│
├── n8n/
│   ├── 01-create-patient.json
│   ├── 02-list-patients.json
│   ├── 03-get-patient.json
│   ├── 04-update-patient.json
│   └── 05-delete-patient.json
│
├── database/
│   └── schema.sql
│
├── vapi/
│   ├── assistant-config.json
│   └── create-patient-tool.json
│
└── docs/
    └── architecture.md
```

## Assessment Scope

This repository was created for the CareCloud AI Engineer technical
assessment.

The system demonstrates integration between:

**Telephony → Voice AI → LLM → REST API → Validation → Database**
