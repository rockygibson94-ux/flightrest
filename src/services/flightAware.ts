/**
 * FlightAware AeroAPI v4
 * Docs: https://flightaware.com/aeroapi/portal/documentation
 *
 * Requires: FLIGHTAWARE_API_KEY in your environment / config.
 * Set it in app.json extra.flightAwareApiKey or via EAS secrets.
 */

import type { Flight, FlightStatus } from '../types';

const AEROAPI_BASE = 'https://aeroapi.flightaware.com/aeroapi';
// Key is stored as an EAS secret (FLIGHTAWARE_API_KEY) for production builds.
// For local dev it falls back to the value below.
const API_KEY = process.env.FLIGHTAWARE_API_KEY ?? 'nRNqxaulFP9Cx7qLuP2PXQhNs9qr0wVi';

// Browser (web preview) → route through local proxy to avoid CORS.
// Native iOS/Android → call FlightAware directly.
const IS_WEB = typeof document !== 'undefined';
const PROXY = 'http://localhost:3001';

async function request<T>(path: string): Promise<T> {
  const targetUrl = `${AEROAPI_BASE}${path}`;
  const fetchUrl = IS_WEB
    ? `${PROXY}?url=${encodeURIComponent(targetUrl)}`
    : targetUrl;

  const res = await fetch(fetchUrl, {
    headers: IS_WEB
      ? { Accept: 'application/json' }
      : { 'x-apikey': API_KEY, Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`FlightAware error ${res.status}: ${await res.text()}`);
  }

  return res.json() as Promise<T>;
}

// ─── Raw API types (subset) ──────────────────────────────────────────────────

interface AeroFlightInfo {
  ident: string;
  origin: { code_iata: string };
  destination: { code_iata: string };
  scheduled_out: string;   // ISO-8601, gate departure
  estimated_out: string;
  actual_out: string | null;
  gate_origin: string | null;
  gate_destination: string | null;
  status: string;
  delay: number | null;    // minutes
}

interface AeroFlightsResponse {
  flights: AeroFlightInfo[];
}

// ─── Map AeroAPI status to our type ─────────────────────────────────────────

function mapStatus(raw: string): FlightStatus {
  const s = raw.toLowerCase();
  if (s.includes('cancel')) return 'cancelled';
  if (s.includes('land') || s.includes('arrived')) return 'landed';
  if (s.includes('en route') || s.includes('airborne')) return 'en_route';
  if (s.includes('delay')) return 'delayed';
  return 'scheduled';
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Look up a flight by IATA ident (e.g. "DL402") for today.
 * Returns the most relevant upcoming/active flight.
 */
export async function fetchFlight(flightNumber: string): Promise<Flight> {
  const ident = flightNumber.replace(/\s+/g, '').toUpperCase();
  const data = await request<AeroFlightsResponse>(
    `/flights/${ident}?max_pages=1`
  );

  if (!data.flights.length) {
    throw new Error(`No flights found for ${flightNumber}`);
  }

  // Pick the first upcoming or active flight
  const raw = data.flights[0];
  const scheduledDeparture = new Date(raw.scheduled_out);
  const estimatedDeparture = new Date(raw.estimated_out || raw.scheduled_out);
  const delayMinutes = raw.delay ?? 0;

  // AeroAPI doesn't give explicit boarding time — estimate 30 min before departure
  const boardingTime = new Date(estimatedDeparture.getTime() - 30 * 60_000);

  // Parse concourse from gate (e.g. "E14" → "E")
  const gate = raw.gate_origin ?? null;
  const concourseChar = gate ? gate.charAt(0).toUpperCase() : null;
  const validConcourses = ['T', 'A', 'B', 'C', 'D', 'E', 'F'];
  const concourse =
    concourseChar && validConcourses.includes(concourseChar)
      ? (concourseChar as import('../types').ATLConcourse)
      : null;

  return {
    flightNumber: raw.ident,
    origin: raw.origin.code_iata,
    destination: raw.destination.code_iata,
    scheduledDeparture,
    estimatedDeparture,
    boardingTime,
    gate,
    concourse,
    terminal: null,
    status: mapStatus(raw.status),
    delayMinutes,
  };
}

/**
 * Refresh an existing flight — only fetches fields that may change.
 */
export async function refreshFlight(flightNumber: string): Promise<Partial<Flight>> {
  const full = await fetchFlight(flightNumber);
  return {
    estimatedDeparture: full.estimatedDeparture,
    boardingTime: full.boardingTime,
    gate: full.gate,
    concourse: full.concourse,
    status: full.status,
    delayMinutes: full.delayMinutes,
  };
}
