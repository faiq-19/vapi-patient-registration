# System Architecture

## Overview

The Voice AI Patient Registration system is a small, event-driven
application composed of four primary layers:

1.  **Vapi** --- telephony and conversational voice interface
2.  **n8n** --- REST API and orchestration layer
3.  **Supabase PostgreSQL** --- persistent data layer
4.  **OpenAI GPT-4.1** --- language model used by the voice agent

The architecture intentionally uses managed services to minimize
infrastructure complexity and focus implementation effort on
conversational quality, validation, integration, and reliable
persistence.

## High-Level Architecture

``` text
                         ┌──────────────────────┐
                         │       Caller         │
                         │     U.S. Phone       │
                         └──────────┬───────────┘
                                    │
                                    │ PSTN / VoIP
                                    ▼
                         ┌──────────────────────┐
                         │        Vapi          │
                         │ Telephony + Voice AI │
                         │ STT / TTS / Call Mgmt │
                         └──────────┬───────────┘
                                    │
                                    │ LLM conversation
                                    ▼
                         ┌──────────────────────┐
                         │    OpenAI GPT-4.1    │
                         │ Conversational Logic │
                         └──────────┬───────────┘
                                    │
                                    │ create_patient tool
                                    ▼
                         ┌──────────────────────┐
                         │       n8n Cloud      │
                         │     REST API Layer   │
                         │ Validation + Routing │
                         └──────────┬───────────┘
                                    │
                                    │ SQL / Supabase API
                                    ▼
                         ┌──────────────────────┐
                         │       Supabase       │
                         │    PostgreSQL DB     │
                         │ Persistent Patients  │
                         └──────────────────────┘
```

## Component Responsibilities

### 1. Vapi

Vapi is responsible for:

-   Providing the public U.S. phone number
-   Receiving incoming calls
-   Handling the voice conversation
-   Speech-to-text
-   Text-to-speech
-   Maintaining the conversational context
-   Invoking the `create_patient` function after explicit confirmation
-   Returning backend tool results to the voice agent

The Vapi assistant is configured with a system prompt that defines the
patient-registration behavior.

The agent is instructed to:

-   Collect required fields naturally
-   Accept variations in how callers provide information
-   Handle corrections
-   Validate conversationally
-   Offer optional fields
-   Confirm all collected information
-   Save only after explicit confirmation
-   Never claim a successful save if the backend fails

### 2. OpenAI GPT-4.1

The LLM provides the conversational reasoning layer.

It is responsible for interpreting natural language such as:

``` text
"My birthday is March thirtieth, two thousand four."
```

and converting the information into structured values suitable for the
backend.

The prompt also instructs the model to recognize corrections and
preserve previously collected information rather than restarting the
registration.

### 3. n8n Cloud

n8n acts as the public REST API and orchestration layer.

The REST API exposes:

``` text
POST   /webhook/patients
GET    /webhook/patients
GET    /webhook/patients/:id
PUT    /webhook/patients/:id
DELETE /webhook/patients/:id
```

n8n is responsible for:

-   Receiving HTTP requests
-   Parsing request data
-   Server-side validation
-   Querying Supabase
-   Creating patient records
-   Updating patient records
-   Soft deleting patient records
-   Returning consistent JSON responses
-   Logging relevant execution information

Using n8n also keeps the implementation small enough to complete within
the assessment's time constraint.

### 4. Supabase PostgreSQL

Supabase provides the persistent relational database.

The database stores:

-   Patient demographic information
-   UUID patient identifiers
-   Creation timestamps
-   Modification timestamps
-   Soft-delete timestamps

The database is independent of Vapi and n8n execution state. Therefore,
patient records remain available after individual workflow executions or
service restarts.

## Voice Registration Flow

The normal registration flow is:

``` text
1. Caller dials Vapi number
             │
             ▼
2. Vapi answers the call
             │
             ▼
3. Agent greets caller
             │
             ▼
4. Agent collects required demographics
             │
             ▼
5. Agent validates/clarifies information
             │
             ▼
6. Agent optionally collects additional demographics
             │
             ▼
7. Agent reads back collected information
             │
             ▼
8. Caller explicitly confirms
             │
             ▼
9. Vapi calls create_patient
             │
             ▼
10. n8n validates request
             │
             ▼
11. n8n writes patient to Supabase
             │
             ▼
12. Supabase returns created record
             │
             ▼
13. n8n returns success to Vapi
             │
             ▼
14. Agent confirms registration
             │
             ▼
15. Call ends gracefully
```

## REST API Flow

The REST API can also be used independently of the voice agent.

### Create

``` text
Client
  │
  │ POST /webhook/patients
  ▼
n8n
  │
  │ Validate
  ▼
Supabase
  │
  │ Insert
  ▼
n8n
  │
  ▼
JSON response
```

### Read

``` text
Client
  │
  │ GET /webhook/patients
  ▼
n8n
  │
  │ Query
  ▼
Supabase
  │
  ▼
n8n
  │
  ▼
JSON response
```

### Update

``` text
Client
  │
  │ PUT /webhook/patients/:id
  ▼
n8n
  │
  │ Validate + update
  ▼
Supabase
  │
  ▼
n8n
  │
  ▼
JSON response
```

### Soft Delete

``` text
Client
  │
  │ DELETE /webhook/patients/:id
  ▼
n8n
  │
  │ Set deleted_at
  ▼
Supabase
  │
  ▼
n8n
  │
  ▼
JSON response
```

## Data Model

The central entity is `patients`.

Conceptually:

``` text
patients
├── patient_id (UUID, primary key)
├── first_name
├── last_name
├── date_of_birth
├── sex
├── phone_number
├── email
├── address_line_1
├── address_line_2
├── city
├── state
├── zip_code
├── insurance_provider
├── insurance_member_id
├── preferred_language
├── emergency_contact_name
├── emergency_contact_phone
├── created_at
├── updated_at
└── deleted_at
```

Required fields are enforced by the API validation layer and database
constraints where appropriate.

## Validation Strategy

Validation exists at two levels.

### Conversational validation

Vapi/LLM handles conversational clarification:

``` text
Caller:
"My phone is 123."

Agent:
"Could you give me your 10-digit U.S. phone number?"
```

### Server-side validation

n8n validates the actual HTTP payload before writing to the database.

This is important because the backend must not trust the voice agent
alone.

Examples:

-   Required fields must be present
-   Names must use permitted characters
-   Date of birth must be valid and not in the future
-   Phone number must represent a valid U.S. 10-digit number
-   State must be a valid two-letter U.S. abbreviation
-   ZIP code must match U.S. ZIP/ZIP+4 format
-   Email must be valid when supplied

## Error Handling

If validation fails, n8n returns a structured error response.

Example:

``` json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required fields"
  }
}
```

If the database operation fails, the API returns an appropriate server
error.

The Vapi agent is instructed not to claim successful registration unless
the backend reports success.

## Security

Secrets are kept outside source control.

Examples include:

``` text
SUPABASE_SERVICE_ROLE_KEY
VAPI_API_KEY
OPENAI_API_KEY
```

These values should be configured through the appropriate provider
credential/secret mechanisms.

The GitHub repository should contain configuration templates and
documentation, not live credentials.

## Why This Architecture?

The assessment has a strict three-hour implementation limit. Building a
custom telephony stack, speech-to-text service, text-to-speech service,
backend API, and database from scratch would introduce unnecessary
infrastructure overhead.

The selected architecture delegates infrastructure-heavy
responsibilities to managed services:

-   Vapi → telephony and voice infrastructure
-   OpenAI → language reasoning
-   n8n → API/orchestration
-   Supabase → managed PostgreSQL

This allows the implementation to focus on the assessment's actual
evaluation areas:

-   End-to-end integration
-   Conversational behavior
-   Validation
-   Persistence
-   Error handling
-   Clean separation of responsibilities

## Separation of Concerns

The system intentionally separates responsibilities:

``` text
Vapi
└── Voice interaction and conversational behavior

OpenAI
└── Natural-language understanding and reasoning

n8n
└── HTTP API, validation, orchestration

Supabase
└── Persistent data storage
```

This means that changing the database does not require rewriting the
voice conversation, and changing the voice provider does not require
redesigning the patient database.

## Current Scope

The core implementation supports:

-   Voice-based patient registration
-   Required demographic collection
-   Optional demographic collection
-   Conversational correction
-   Confirmation before persistence
-   Server-side validation
-   Patient creation
-   Persistent storage
-   REST CRUD operations
-   Soft deletion

## Potential Extensions

The following can be added without changing the overall architecture:

### Duplicate detection

Vapi can call a patient lookup endpoint using the caller's phone number:

``` text
Vapi
  │
  ▼
GET /webhook/patients?phone_number=...
  │
  ▼
Supabase
```

If a matching record exists, the agent can offer an update instead of
creating a new patient.

### Dashboard

A separate web frontend can consume the existing REST API:

``` text
Browser
   │
   ▼
Dashboard
   │
   ▼
n8n REST API
   │
   ▼
Supabase
```

### Call transcripts

Call metadata/transcripts can be stored in an additional database table
and linked to `patient_id`.

### Automated tests

The REST API can be tested independently using integration tests against
a test database.

## Deployment

The deployed architecture is:

``` text
Public U.S. Phone Number
        │
        ▼
      Vapi
        │
        ▼
     n8n Cloud
        │
        ▼
     Supabase
```

The GitHub repository stores the reproducible workflow/configuration
files and documentation. The live runtime remains hosted by Vapi, n8n
Cloud, and Supabase.
