import type { NextApiRequest, NextApiResponse } from 'next'
import { getEvents } from '../../server/events'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const data = await getEvents()
    return res.status(200).json(data)
  }
  return res.status(405).end()
}
