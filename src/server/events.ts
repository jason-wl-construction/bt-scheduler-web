import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// Convert tasks to FullCalendar-like events
export async function getEvents() {
  const tasks = await prisma.task.findMany({
    include: { project: true, assignments: true }
  })
  return tasks.map((t: any) => ({
    id: t.id,
    title: `${t.project.name}: ${t.name}`,
    start: t.startDate,
    end: t.endDate,
    extendedProps: {
      status: t.status,
      progress: t.progress
    }
  }))
}
