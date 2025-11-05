import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') return res.status(405).end()

  try {
    const { id, start, end } = req.body as { id: string; start: string; end: string }

    if (!id || !start || !end) {
      return res.status(400).json({ error: 'Missing id, start, or end' })
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        startDate: new Date(start),
        endDate: new Date(end),
      },
    })

    return res.status(200).json({ ok: true, task })
  } catch (err: any) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to update task' })
  }
}
