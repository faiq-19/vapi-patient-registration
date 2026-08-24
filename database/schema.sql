-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.patients (
  patient_id uuid NOT NULL DEFAULT gen_random_uuid(),
  first_name character varying NOT NULL CHECK (first_name::text ~ '^[A-Za-zÀ-ÿ''-]+$'::text),
  last_name character varying NOT NULL CHECK (last_name::text ~ '^[A-Za-zÀ-ÿ''-]+$'::text),
  date_of_birth date NOT NULL CHECK (date_of_birth <= CURRENT_DATE),
  sex character varying NOT NULL CHECK (sex::text = ANY (ARRAY['Male'::character varying, 'Female'::character varying, 'Other'::character varying, 'Decline to Answer'::character varying]::text[])),
  phone_number character varying NOT NULL CHECK (phone_number::text ~ '^[0-9]{10}$'::text),
  email character varying CHECK (email IS NULL OR email::text ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'::text),
  address_line_1 character varying NOT NULL,
  address_line_2 character varying,
  city character varying NOT NULL,
  state character NOT NULL CHECK (state ~ '^[A-Z]{2}$'::text),
  zip_code character varying NOT NULL CHECK (zip_code::text ~ '^[0-9]{5}(-[0-9]{4})?$'::text),
  insurance_provider character varying,
  insurance_member_id character varying,
  preferred_language character varying DEFAULT 'English'::character varying,
  emergency_contact_name character varying,
  emergency_contact_phone character varying CHECK (emergency_contact_phone IS NULL OR emergency_contact_phone::text ~ '^[0-9]{10}$'::text),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT patients_pkey PRIMARY KEY (patient_id)
);
