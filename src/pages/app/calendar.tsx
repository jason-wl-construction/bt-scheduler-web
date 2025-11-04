import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { fetchEvents } from '../../utils/api'

// After installing FullCalendar, uncomment below:
// const FullCalendar = dynamic(() => import('@fullcalendar/react'), { ssr: false });
// import dayGridPlugin from '@fullcalendar/daygrid'
// import timeGridPlugin from '@fullcalendar/timegrid'
// import interactionPlugin from '@fullcalendar/interaction'

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    fetchEvents().then(setEvents).catch(console.error)
  }, [])

  return (
    <main style={{ padding: 16 }}>
      <h1>Calendar</h1>
      <p>(Install FullCalendar and uncomment code to enable the calendar UI.)</p>
      {/*
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
      */}
      <pre>{JSON.stringify(events.slice(0,5), null, 2)}</pre>
    </main>
  )
}
