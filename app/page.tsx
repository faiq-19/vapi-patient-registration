"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

type Patient = {
  patient_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  phone_number: string;
  state: string;
  created_at: string;
};

const phone = process.env.NEXT_PUBLIC_VAPI_PHONE_NUMBER || "+15862219236";

export default function Home() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [status, setStatus] = useState("Checking API...");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      const response = await fetch("/api/patients", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "API error");
      setPatients(body.data || []);
      setStatus("API + database online");
    } catch {
      setStatus("API unavailable");
    }
  }

  useEffect(() => { refresh(); }, []);

  async function createDemo(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    const suffix = String(Date.now()).slice(-7).padStart(7, "0");
    await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: "Demo",
        last_name: "Patient",
        date_of_birth: "1995-05-20",
        sex: "Other",
        phone_number: `212${suffix}`,
        address_line_1: "123 Main Street",
        city: "New York",
        state: "NY",
        zip_code: "10001"
      })
    });
    await refresh();
    setBusy(false);
  }

  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">CareCloud Technical Assessment</p>
          <h1>Voice AI Patient Registration</h1>
          <p className="muted">Vapi + Next.js + Supabase. One page to call the agent, inspect saved patients, and test the REST API.</p>
        </div>
        <span className={status.includes("online") ? "status ok" : "status"}>● {status}</span>
      </section>

      <section className="grid">
        <article className="card accent">
          <p className="label">Voice Agent</p>
          <h2>{phone}</h2>
          <p className="muted">Call and register a test patient using natural conversation.</p>
          <a className="button" href={`tel:${phone}`}>Call Voice Agent</a>
        </article>
        <article className="card">
          <p className="label">Stored Patients</p>
          <h2>{patients.length}</h2>
          <p className="muted">Persistent records currently visible through the API.</p>
          <button className="button secondary" onClick={refresh}>Refresh</button>
        </article>
        <article className="card">
          <p className="label">Quick Test</p>
          <h2>REST API</h2>
          <p className="muted">Creates one clearly fake patient to verify API → database persistence.</p>
          <form onSubmit={createDemo}><button className="button secondary" disabled={busy}>{busy ? "Creating..." : "Create Demo Patient"}</button></form>
        </article>
      </section>

      <section className="card table-card">
        <div className="section-head"><div><p className="label">Dashboard</p><h2>Registered Patients</h2></div><code>GET /api/patients</code></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>DOB</th><th>Phone</th><th>State</th><th>Created</th></tr></thead>
            <tbody>
              {patients.length === 0 ? <tr><td colSpan={5} className="empty">No patients yet. Call the agent or create a demo patient.</td></tr> : patients.map(p => (
                <tr key={p.patient_id}><td>{p.first_name} {p.last_name}</td><td>{p.date_of_birth}</td><td>{p.phone_number}</td><td>{p.state}</td><td>{new Date(p.created_at).toLocaleString()}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card api">
        <p className="label">Reviewer API</p>
        <h2>Endpoints</h2>
        <div className="endpoints"><code>GET /api/patients</code><code>GET /api/patients/:id</code><code>POST /api/patients</code><code>PUT /api/patients/:id</code><code>DELETE /api/patients/:id</code></div>
        <p className="muted small">Filters: <code>?last_name=</code> <code>?date_of_birth=</code> <code>?phone_number=</code>. DELETE is a soft delete.</p>
      </section>
    </main>
  );
}
