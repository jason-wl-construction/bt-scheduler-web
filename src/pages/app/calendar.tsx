import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { fetchEvents } from '../../utils/api'

// FullCalendar
const FullCalendar = dynamic(() => import('@fullcalendar/react'), { ssr: false })
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchEvents().then(setEvents).catch(console.error)
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
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(`Save failed: ${msg}`)
      }
      const refreshed = await fetchEvents()
      setEvents(refreshed)
    } catch (e) {
      console.error(e)
      alert('Could not save the change. (See console for details.)')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main style={{ padding: 16 }}>
      <h1>Calendar {saving ? '· saving…' : ''}</h1>

      <div style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto' }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          height="auto"
          events={events}
          editable={true}
          eventStartEditable={true}
          eventDurationEditable={true}
          eventResizableFromStart={true}
          selectable={true}
          dateClick={(info: any) => alert(`Date clicked: ${info.dateStr}`)}
          eventClick={(info: any) => alert(`Clicked: ${info.event.title}`)}
          eventDrop={(info: any) => {
            const id = info.event.id
            const start = info.event.start!
            const end = info.event.end ?? start
            saveDates(id, start, end)
          }}
          eventResize={(info: any) => {
            const id = info.event.id
            const start = info.event.start!
            const end = info.event.end ?? start
            saveDates(id, start, end)
          }}
          longPressDelay={0}
        />
      </div>
    </main>
  )
}
