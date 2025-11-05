import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ---- Helpers ---------------------------------------------------------------
// FullCalendar sends all-day events with an *exclusive* end (day after the last visible day).
// We store an *inclusive* end in the DB: last visible day at 00:00.
function exclusiveEndToInclusive(endInput: string | Date | null | undefined): Date | null {
  if (!endInput) return null;
  const d = new Date(endInput);
  if (isNaN(d.getTime())) return null;
  d.setDate(d.getDate() - 1); // subtract one calendar day
  d.setHours(0, 0, 0, 0); // snap to midnight to avoid TZ drift
  return d;
}

function normalizeAllDayStart(startInput: string | Date): Date {
  const d = new Date(startInput);
  if (isNaN(d.getTime())) throw new Error("Invalid start date");
  d.setHours(0, 0, 0, 0);
  return d;
}

// For timed events we keep the timestamps as-is.
function asDate(input: string | Date): Date {
  const d = new Date(input);
  if (isNaN(d.getTime())) throw new Error("Invalid date");
  return d;
}

// ---- Route ----------------------------------------------------------------
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Minimal, readable logging to help diagnose off-by-one issues
  try {
    console.log("fc:update:method", req.method);
    console.log("fc:update:raw-body", JSON.stringify(req.body));
    console.log("fc:update:tz-offset-minutes", new Date().getTimezoneOffset());
  } catch {}

  if (req.method !== "PUT" && req.method !== "POST") {
    res.setHeader("Allow", ["PUT", "POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { id, start, end, allDay } = req.body || {};

    if (!id) return res.status(400).json({ error: "Missing id" });
    if (!start) return res.status(400).json({ error: "Missing start" });

    let startForDb: Date;
    let endForDb: Date | null = null;

    if (allDay) {
      // All-day: start snapped to midnight, end converted from exclusive→inclusive
      startForDb = normalizeAllDayStart(start);
      endForDb = exclusiveEndToInclusive(end ?? start);
    } else {
      // Timed: keep as-is
      startForDb = asDate(start);
      endForDb = end ? asDate(end) : null;
    }

    // Build update payload. We update only date fields to avoid schema assumptions.
    const data: Record<string, any> = {
      start_date: startForDb,
    };
    if (endForDb) data.end_date = endForDb;

    const updated = await prisma.tasks.update({
      where: { id: Number(id) },
      data,
      select: { id: true },
    });

    return res.status(200).json({ ok: true, id: updated.id });
  } catch (err: any) {
    console.error("/api/task/update error", err);
    return res.status(500).json({ error: err?.message ?? "Internal Server Error" });
  }
}
