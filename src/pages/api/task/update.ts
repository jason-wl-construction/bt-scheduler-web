import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ---- Helpers ---------------------------------------------------------------
// Convert FullCalendar all-day *exclusive* end to DB *inclusive* end
function exclusiveEndToInclusive(endInput: string | Date | null | undefined): Date | null {
  if (!endInput) return null;
  const d = new Date(endInput);
  if (isNaN(d.getTime())) return null;
  d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function normalizeAllDayStart(startInput: string | Date): Date {
  const d = new Date(startInput);
  if (isNaN(d.getTime())) throw new Error("Invalid start date");
  d.setHours(0, 0, 0, 0);
  return d;
}

function asDate(input: string | Date): Date {
  const d = new Date(input);
  if (isNaN(d.getTime())) throw new Error("Invalid date");
  return d;
}

// Extract a field from many possible client shapes
function pick<T = any>(obj: any, keys: string[]): T | undefined {
  for (const k of keys) {
    const parts = k.split(".");
    let v: any = obj;
    let ok = true;
    for (const p of parts) {
      if (v && p in v) v = v[p]; else { ok = false; break; }
    }
    if (ok && v !== undefined && v !== null) return v as T;
  }
  return undefined;
}

// ---- Route ----------------------------------------------------------------
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    // Tolerate various shapes from FullCalendar/client code
    const id = pick<string>(req.body, ["id", "eventId", "event.id"]);
    const start = pick<string | Date>(req.body, ["start", "startStr", "startISO", "event.start", "event.startStr"]);
    const end = pick<string | Date | null>(req.body, ["end", "endStr", "endISO", "event.end", "event.endStr"]);
    const rawAllDay = pick<any>(req.body, ["allDay", "event.allDay", "isAllDay"]);
    const allDay = !!rawAllDay;

    // NEW: resolved values log (plain and reliable)
    console.log("fc:update:resolved", JSON.stringify({ id, start, end, allDay }));

    if (!id) return res.status(400).json({ error: "Missing id" });
    if (!start) return res.status(400).json({ error: "Missing start" });

    let startForDb: Date;
    let endForDb: Date | null = null;

    if (allDay) {
      startForDb = normalizeAllDayStart(start);
      endForDb = exclusiveEndToInclusive(end ?? start);
    } else {
      startForDb = asDate(start);
      endForDb = end ? asDate(end) : null;
    }

    const data: Record<string, any> = { start_date: startForDb };
    if (endForDb) data.end_date = endForDb;

    const updated = await prisma.task.update({
      where: { id: String(id) },
      data,
      select: { id: true },
    });

    return res.status(200).json({ ok: true, id: updated.id });
  } catch (err: any) {
    console.error("/api/task/update error", err);
    return res.status(500).json({ error: err?.message ?? "Internal Server Error" });
  }
}
