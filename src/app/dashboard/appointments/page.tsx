'use server';

import { AgendaView, type CalendarEvent } from '@/components/dashboard/agenda-view';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { DateTime } from 'luxon';

const AGENDA_WEBHOOK_URL = 'https://n8n.srv1002935.hstgr.cloud/webhook/calendar-tony';

async function getInitialAgendaData(): Promise<{ events: CalendarEvent[], error?: string | null }> {
  if (!AGENDA_WEBHOOK_URL) {
    return { events: [], error: "La URL del Webhook de la agenda no está configurada." };
  }
  
  try {
    const response = await fetch(AGENDA_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cb: Date.now() }), // Cache-busting
      cache: 'no-store', // Ensure fresh data
    });
    
    if (!response.ok) {
      throw new Error(`Error de red: ${response.statusText}`);
    }
    
    const responseText = await response.text();
    // Handle cases where the webhook returns an empty response for no events
    const data = responseText ? JSON.parse(responseText) : { ok: true, items: [] };

    if (data.ok && Array.isArray(data.items)) {
      // Keep dates as ISO strings for serialization
      const events = data.items.map((ev: any) => ({
        ...ev,
        start: DateTime.fromISO(ev.start, { zone: 'Europe/Madrid' }).toISO(),
        end: DateTime.fromISO(ev.end, { zone: 'Europe/Madrid' }).toISO(),
        uid: ev.id,
      }));
      return { events };
    } else {
      return { events: [] };
    }
  } catch (err: any) {
    console.error("Error fetching initial agenda data:", err);
    return { events: [], error: `Error al cargar la agenda: ${err.message}` };
  }
}

export default async function AppointmentsPage() {
  const { events, error } = await getInitialAgendaData();
  
  return (
    <div className="flex-1 flex flex-col h-full bg-muted/20">
      <AgendaView initialEvents={events as CalendarEvent[]} error={error} />
    </div>
  );
}
