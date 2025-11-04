import Link from 'next/link'

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>BT Scheduler</h1>
      <p>Lightweight calendar/scheduling app.</p>
      <ul>
        <li><Link href="/app/calendar">Open Calendar</Link></li>
      </ul>
    </main>
  )
}
