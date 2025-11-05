import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// helper: add days to a JS Date (without mutating original)
function addDays(d: Date, n: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

// Convert tasks to FullCalendar events as ALL-DAY items
export async function getEvents() {
  const tasks = await prisma.task.findMany({
    include: { project: true, assignments: true }
  })

  return tasks.map((t: any) => {
    const start = new Date(t.startDate)
    const endInclusive = new Date(t.endDate)      // DB stores inclusive end
    const endExclusive = addDays(endInclusive, 1) // FC all-day expects exclusive end

    return {
      id: t.id,
      title: `${t.project.name}: ${t.name}`,
      start,                 // JS Date
      end: endExclusive,     // exclusive for all-day
      allDay: true,          // <— key for month-view drag/resize
      extendedProps: {
        status: t.status,
        progress: t.progress
      }
    }
  })
}
