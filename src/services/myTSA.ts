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

/**
 * Returns a single representative wait time (minutes) for the alarm calculation.
 * Uses the shortest non-zero wait from available checkpoints, or a default.
 */
export function getBestWaitMinutes(waits: SecurityWait[], hasTSAPreCheck: boolean): number {
  if (!waits.length) return 22; // conservative default

  const nonZero = waits.filter((w) => w.waitMinutes > 0);
  if (!nonZero.length) return 10;

  // TSA PreCheck lanes are typically ~40% of standard wait
  const values = nonZero.map((w) =>
    hasTSAPreCheck ? Math.round(w.waitMinutes * 0.4) : w.waitMinutes
  );

  return Math.min(...values);
}
