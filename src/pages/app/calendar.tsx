import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { fetchEvents } from '../../utils/api'

// FullCalendar (loaded only in the browser)
const FullCalendar = dynamic(() => import('@fullcalendar/react'), { ssr: false })
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

type CalEvent = {
  id: string
  title: string
  start: string | Date
  end?: string | Date
  allDay?: boolean
  extendedProps?: Record<string, unknown>
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalEvent[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchEvents()
      .then((data) => setEvents(data as CalEvent[]))
      .catch(console.error)
  }, [])

  async function saveDates(id: string, start: Date, end: Date) {
    setSaving(true)
    try {
      const res = await fetch('/api/task/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          start: start.toISOString(),
          end: end.toISOString(),
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const refreshed = await fetchEvents()
      setEvents(refreshed as CalEvent[])
    } catch (err) {
      console.error(err)
      alert('Could not save the change.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main style={{ padding: 16 }}>
      <h1>Calendar {saving ? '· saving…' : ''}</h1>

      <div style={{ position: 'relative', zIndex: 10 }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          height="auto"
          events={events as any}
          editable={true}
          eventStartEditable={true}
          eventDurationEditable={true}
          eventResizableFromStart={true}
          selectable={true}
          longPressDelay={0}
          eventDrop={(info: any) => {
            const id = String(info.event.id)
            const start = info.event.start as Date
            const end = (info.event.end as Date) ?? start
            saveDates(id, start, end)
          }}
          eventResize={(info: any) => {
            const id = String(info.event.id)
            const start = info.event.start as Date
            const end = (info.event.end as Date) ?? start
            saveDates(id, start, end)
          }}
        />
      </div>
    </main>
  )
}
