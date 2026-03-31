/**
 * MyTSA Web Service — free, no API key required.
 * Endpoint: https://apps.tsa.dhs.gov/MyTSAWebService/GetTSOWaitTimes.aspx
 *
 * For ATL, we also scrape atl.com/times/ for live checkpoint data.
 */

import type { SecurityWait } from '../types';

const MYTSA_URL =
  'https://apps.tsa.dhs.gov/MyTSAWebService/GetTSOWaitTimes.aspx?ap=';

// ─── MyTSA ────────────────────────────────────────────────────────────────────

interface MyTSAEntry {
  AirportCode: string;
  CheckpointIndex: string;
  CheckpointName: string;
  WaitTime: string;       // minutes as string, or "0" when closed
  Created_Datetime: string;
}

interface MyTSAResponse {
  WaitTimes: { WaitTime: MyTSAEntry[] };
}

export async function fetchMyTSAWaits(airportCode: string): Promise<SecurityWait[]> {
  const url = `${MYTSA_URL}${airportCode.toUpperCase()}&output=json`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`MyTSA error ${res.status}`);
  }

  const data: MyTSAResponse = await res.json();
  const entries = data?.WaitTimes?.WaitTime ?? [];

  return entries.map((e) => ({
    airport: airportCode.toUpperCase(),
    checkpoint: e.CheckpointName || `Checkpoint ${e.CheckpointIndex}`,
    waitMinutes: parseInt(e.WaitTime, 10) || 0,
    updatedAt: new Date(e.Created_Datetime),
    source: 'mytsa' as const,
  }));
}

// ─── ATL Live (atl.com/times/) ────────────────────────────────────────────────
// ATL provides a JSON feed used by their website.
// This parses the live security wait times for ATL checkpoints.

const ATL_TIMES_URL = 'https://www.atl.com/times/';

interface ATLTimesEntry {
  name: string;
  wait: number;
}

/**
 * Attempts to fetch ATL-specific live wait times.
 * Falls back gracefully to an empty array on failure.
 */
export async function fetchATLLiveWaits(): Promise<SecurityWait[]> {
  try {
    const res = await fetch(ATL_TIMES_URL, {
      headers: { Accept: 'application/json, text/html' },
    });

    if (!res.ok) return [];

    const text = await res.text();

    // ATL embeds JSON in a <script id="__NEXT_DATA__"> tag or similar.
    // Parse the page for wait time data.
    const jsonMatch = text.match(/"waitTimes"\s*:\s*(\[.*?\])/s);
    if (!jsonMatch) return [];

    const raw: ATLTimesEntry[] = JSON.parse(jsonMatch[1]);
    return raw.map((entry) => ({
      airport: 'ATL',
      checkpoint: entry.name,
      waitMinutes: entry.wait,
      updatedAt: new Date(),
      source: 'atl_live' as const,
    }));
  } catch {
    return [];
  }
}

// ─── Combined fetch for ATL ────────────────────────────────────────────────────

/**
 * Returns the best available wait time for a given airport.
 * For ATL, merges MyTSA data with live ATL data (ATL live takes priority).
 */
export async function fetchSecurityWaits(airportCode: string): Promise<SecurityWait[]> {
  const isATL = airportCode.toUpperCase() === 'ATL';

  const [myTSA, atlLive] = await Promise.all([
    fetchMyTSAWaits(airportCode).catch(() => [] as SecurityWait[]),
    isATL ? fetchATLLiveWaits() : Promise.resolve([] as SecurityWait[]),
  ]);

  // ATL live data overrides MyTSA when available
  return atlLive.length > 0 ? [...atlLive, ...myTSA] : myTSA;
}

// ─── Historical wait time model ───────────────────────────────────────────────
// Used silently when live data is stale (>30 min old) or unavailable.
// Based on time-of-day, day-of-week, and airport size.

const BUSY_AIRPORTS = new Set([
  'ATL','LAX','ORD','JFK','LGA','EWR','DFW','DEN','SFO','SEA','BOS','MIA','PHX','MSP','DTW',
]);
const MEDIUM_AIRPORTS = new Set([
  'CLT','MCO','LAS','IAH','HOU','MDW','BWI','IAD','DCA','SAN','TPA','PDX','SLC','STL','MCI',
]);

function getHistoricalWaitMinutes(airportCode: string, hour: number, dayOfWeek: number): number {
  // Base wait by time of day (hour = local 0–23)
  let base: number;
  if (hour >= 4 && hour < 7)       base = 38;  // early morning rush
  else if (hour >= 7 && hour < 10) base = 48;  // peak morning
  else if (hour >= 10 && hour < 15) base = 26; // midday
  else if (hour >= 15 && hour < 19) base = 42; // afternoon peak
  else if (hour >= 19 && hour < 22) base = 22; // evening wind-down
  else                              base = 10; // overnight / red-eye

  // Day-of-week multiplier (0=Sun … 6=Sat)
  const dayMult: Record<number, number> = {
    0: 1.3,  // Sunday
    1: 1.4,  // Monday — business travel peak
    2: 1.0,
    3: 1.0,
    4: 1.1,
    5: 1.4,  // Friday — weekend rush
    6: 1.2,  // Saturday
  };

  // Airport-size multiplier
  const ap = airportCode.toUpperCase();
  const airportMult = BUSY_AIRPORTS.has(ap) ? 1.3 : MEDIUM_AIRPORTS.has(ap) ? 1.1 : 1.0;

  // Conservative buffer for current TSA staffing shortage
  const shortageMult = 1.25;

  return Math.round(base * (dayMult[dayOfWeek] ?? 1.0) * airportMult * shortageMult);
}

const STALE_THRESHOLD_MS = 30 * 60_000; // 30 minutes

/**
 * Returns a single representative wait time (minutes) for the alarm calculation.
 * When live data is stale or missing, silently falls back to a time-of-day
 * historical model so the alarm stays accurate without alarming the user.
 */
export function getBestWaitMinutes(
  waits: SecurityWait[],
  hasTSAPreCheck: boolean,
  airportCode = 'ATL',
): number {
  const now = new Date();
  const cutoff = new Date(now.getTime() - STALE_THRESHOLD_MS);

  // Only trust waits that are fresher than 30 minutes
  const freshWaits = waits.filter((w) => w.updatedAt > cutoff);

  // If no fresh data → use historical model silently
  if (!freshWaits.length) {
    const historical = getHistoricalWaitMinutes(airportCode, now.getHours(), now.getDay());
    return hasTSAPreCheck ? Math.round(historical * 0.4) : historical;
  }

  const nonZero = freshWaits.filter((w) => w.waitMinutes > 0);

  // Fresh data exists but all checkpoints report zero — fall back to a blended value
  if (!nonZero.length) {
    const historical = getHistoricalWaitMinutes(airportCode, now.getHours(), now.getDay());
    const blended = Math.round(historical * 0.5); // split the difference
    return hasTSAPreCheck ? Math.round(blended * 0.4) : blended;
  }

  // Normal path — use the best (shortest) live checkpoint
  const values = nonZero.map((w) =>
    hasTSAPreCheck ? Math.round(w.waitMinutes * 0.4) : w.waitMinutes,
  );
  return Math.min(...values);
}
