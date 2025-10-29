'use client';

import { DateTime } from 'luxon';
import type { CalendarEvent } from './agenda-view';

const PROFESSIONAL_COLORS: { [key: string]: string } = {
  'Ana': '#ef4444', // red-500
  'Joana': '#22c55e', // green-500
  'Maria': '#3b82f6', // blue-500
};

const SERVICE_COLORS: { [key: string]: string } = {
  'Color': '#ec4899', // pink-500
  'Tinte': '#f97316', // orange-500
  'Cortes': '#eab308', // yellow-500
  'Mechas': '#84cc16', // lime-500
  'Peinar': '#22c55e', // green-500
  'Peinados': '#14b8a6', // teal-500
  'Tratamientos Kiki': '#06b6d4', // cyan-500
  'Tratamientos QIQI': '#6366f1', // indigo-500
  'default': '#6b7280', // gray-500
};

const getEventColor = (event: CalendarEvent): string => {
  if (event.service) {
    const serviceKey = Object.keys(SERVICE_COLORS).find(key => event.service!.toLowerCase().includes(key.toLowerCase()));
    if (serviceKey) return SERVICE_COLORS[serviceKey];
  }
  return SERVICE_COLORS['default'];
}

type AgendaTimelineProps = {
  events: CalendarEvent[];
  professionals: string[];
};

export function AgendaTimeline({ events, professionals }: AgendaTimelineProps) {
  const timeSlots = Array.from({ length: 13 }, (_, i) => DateTime.local().set({ hour: 8 + i, minute: 0 }));

  const renderEventOnGrid = (event: CalendarEvent) => {
    const { start, end, uid, title, clientName, service } = event;
    
    if (start.hour < 8 || start.hour >= 21) return null;

    const pixelsPerHour = 80; // Corresponds to h-20 in Tailwind
    const top = ((start.hour - 8) * 60 + start.minute) * (pixelsPerHour / 60);
    const height = Math.max(20, end.diff(start, 'minutes').minutes * (pixelsPerHour / 60) - 2);
    const serviceColor = getEventColor(event);
    
    return (
      <div 
        key={uid}
        className="absolute p-2 rounded-md shadow-sm border-l-4 cursor-pointer overflow-hidden"
        style={{ 
          top: `${top}px`, 
          height: `${height}px`, 
          left: '2px', 
          right: '2px',
          backgroundColor: `${serviceColor}33`, // 20% opacity
          borderColor: serviceColor 
        }}
        title={`${start.toFormat('HH:mm')} - ${end.toFormat('HH:mm')}\nServicio: ${service || title}\nCliente: ${clientName || 'N/A'}`}
      >
        <p className="font-bold text-xs text-foreground truncate">{start.toFormat('HH:mm')}</p>
        <p className="text-xs font-semibold text-foreground/80 truncate">{service || title}</p>
        <p className="text-xs text-muted-foreground truncate">{clientName || ''}</p>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-card rounded-lg shadow-sm overflow-x-auto">
        <div className="flex" style={{ minWidth: `${100 + 220 * professionals.length}px` }}>
            {/* Time column */}
            <div className="w-20 flex-shrink-0 border-r">
                <div className="h-16 sticky top-0 bg-card z-10 flex items-center justify-center font-semibold">
                  <p>Hora</p>
                </div>
                {timeSlots.map(time => (
                    <div key={time.toISOTime()} className="h-20 text-right pr-2 text-sm text-muted-foreground border-t pt-1">
                        {time.minute === 0 ? time.toFormat('HH:mm') : ''}
                    </div>
                ))}
            </div>

            {/* Professionals columns */}
            {professionals.map(prof => (
                <div key={prof} className="flex-1 border-l min-w-[220px]">
                    <div 
                        className="h-16 sticky top-0 bg-card z-10 flex items-center justify-center p-2 border-b-4"
                        style={{ borderBottomColor: PROFESSIONAL_COLORS[prof] || '#6b7280' }}
                    >
                        <span className="font-bold text-foreground text-center">{prof}</span>
                    </div>
                    <div className="relative">
                        {timeSlots.map(time => (
                            <div key={time.toISOTime()} className="h-20 border-t"></div>
                        ))}
                        {events
                            .filter(ev => ev.professional === prof)
                            .map(event => renderEventOnGrid(event))
                        }
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
}
