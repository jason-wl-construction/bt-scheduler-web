import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";


const prisma = new PrismaClient();


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
try {
if (req.method !== "GET") {
res.setHeader("Allow", ["GET"]);
return res.status(405).json({ error: "Method Not Allowed" });
}


const projects = await prisma.projects.findMany({
select: { id: true, name: true },
orderBy: { id: "asc" },
});


return res.status(200).json(projects);
} catch (err: any) {
console.error("/api/projects error", err);
return res.status(500).json({ error: "Internal Server Error" });
}
}
