import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { fetchEvents } from '../../utils/api'

// Enable FullCalendar
const FullCalendar = dynamic(() => import('@fullcalendar/react'), { ssr: false });
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    fetchEvents().then(setEvents).catch(console.error)
  }, [])

  return (
    <main style={{ padding: 16 }}>
      <h1>Calendar</h1>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={events}
      />

      {/* debug preview of first items */}
      <pre>{JSON.stringify(events.slice(0,5), null, 2)}</pre>
    </main>
  )
}
