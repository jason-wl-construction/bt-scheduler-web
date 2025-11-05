import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

// Make an all-day exclusive end (from FullCalendar) into an inclusive end for DB storage
function exclusiveEndToInclusive(endStrOrDate: string | Date | null | undefined) {
  if (!endStrOrDate) return null;
  const d = typeof endStrOrDate === "string" ? new Date(endStrOrDate) : new Date(endStrOrDate);
  if (isNaN(d.getTime())) return null;
  d.setDate(d.getDate() - 1); // subtract one day
  // snap to midnight to avoid timezone drift
  d.setHours(0, 0, 0, 0);
  return d;
}

const prisma = new PrismaClient()

function toDateOnly(d: Date) {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
// ===== DEBUG: log request details as strings
try {
  console.log("fc:update:method", req.method);
  console.log("fc:update:content-type", req.headers["content-type"] || "");
  console.log("fc:update:raw-body", JSON.stringify(req.body));
  console.log("fc:update:tz-offset-minutes", new Date().getTimezoneOffset());
} catch (e) {
  console.log("fc:update:debug-log-error", e);
}
// ===== END DEBUG


  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { id, start, end, allDay } = req.body as {
      id: string
      start: string
      end: string
      allDay?: boolean
    }
    if (!id || !start || !end) {
      return res.status(400).json({ error: 'Missing id, start, or end' })
    }

    const startDt = new Date(start)
    let endDt = new Date(end)

    // FullCalendar all-day gives EXCLUSIVE end; convert to INCLUSIVE for our DATE columns
    if (allDay) {
      const e = new Date(endDt)
      e.setUTCDate(e.getUTCDate() - 1)
      endDt = e
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        startDate: new Date(toDateOnly(startDt)),
        endDate: new Date(toDateOnly(endDt)),
      },
    })

    return res.status(200).json({ ok: true, task: updated })
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to update task' })
  }
}
