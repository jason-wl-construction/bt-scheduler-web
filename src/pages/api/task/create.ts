import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";


const prisma = new PrismaClient();


// Helper: ensure dates are at 00:00 and apply all-day exclusive end conversion
function normalizeAllDayRange(startISO: string, endISO?: string) {
const start = new Date(startISO);
if (isNaN(start.getTime())) throw new Error("Invalid start date");


// Snap to midnight local (FullCalendar all-day convention)
start.setHours(0, 0, 0, 0);


let end: Date;
if (endISO) {
end = new Date(endISO);
} else {
end = new Date(start);
}
end.setHours(0, 0, 0, 0);


// Store inclusive end in DB, but API/FC uses exclusive end. We store inclusive_end = end
// and when returning events we convert to exclusive. Creation stores inclusive for consistency
// with existing `src/server/events.ts` behavior.
return { start, inclusiveEnd: end };
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
try {
if (req.method !== "POST") {
res.setHeader("Allow", ["POST"]);
return res.status(405).json({ error: "Method Not Allowed" });
}


const { title, startDate, endDate, projectId, status } = req.body ?? {};


if (!title || !startDate || !projectId) {
return res.status(400).json({ error: "Missing required fields: title, startDate, projectId" });
}


const { start, inclusiveEnd } = normalizeAllDayRange(startDate, endDate);


// Create in DB; assumes snake_case columns and a `tasks` table with these fields
const task = await prisma.tasks.create({
data: {
title: String(title),
project_id: Number(projectId),
start_date: start,
end_date: inclusiveEnd, // stored inclusive; server/events makes it exclusive for FullCalendar
status: status ?? "todo", // adjust if enum differs
is_all_day: true, // if your schema uses `all_day` or `is_all_day`, align the key below
} as any,
});


return res.status(200).json({ id: task.id });
} catch (err: any) {
console.error("/api/task/create error", err);
return res.status(500).json({ error: err?.message ?? "Internal Server Error" });
}
}
