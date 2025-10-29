'use client';

import { DateTime } from 'luxon';
import type { CalendarEvent } from './agenda-view';
import { Badge } from '@/components/ui/badge';

const PROFESSIONAL_COLORS: { [key: string]: string } = {
  'Ana': '#ef4444', // red-500
  'Joana': '#22c55e', // green-500
  'Maria': '#3b82f6', // blue-500
  'default': '#6b7280', // gray-500
};

interface AppointmentCardProps {
  event: CalendarEvent;
  isPast?: boolean;
  onEventClick: (event: CalendarEvent) => void;
}

export function AppointmentCard({ event, isPast = false, onEventClick }: AppointmentCardProps) {
  const { start, end, title, clientName, clientPhone, status, service, professional } = event;

  const getStatusInfo = () => {
    if (status?.toLowerCase() === 'cancelled') {
      return { text: 'Cancelada', className: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' };
    }
    if (isPast) {
      return { text: 'Completada', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' };
    }
    return { text: 'Próxima', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' };
  };

  const statusInfo = getStatusInfo();
  const professionalColor = PROFESSIONAL_COLORS[professional] || PROFESSIONAL_COLORS.default;
  const formattedDate = start.setLocale('es').toFormat("dd LLL");

  return (
    <div
      onClick={() => onEventClick(event)}
      className="bg-card rounded-lg shadow-sm flex overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200"
      style={{ borderLeft: `4px solid ${professionalColor}` }}
    >
      <div className="p-4 flex-1">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span
              style={{ backgroundColor: professionalColor }}
              className="px-2 py-1 text-xs font-bold rounded-md text-white"
            >
              {professional}
            </span>
            <Badge variant="outline" className={`font-medium ${statusInfo.className}`}>
                {statusInfo.text}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground capitalize">
            {formattedDate}
          </p>
        </div>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p><strong className="font-medium text-foreground">Cliente:</strong> {clientName || 'No especificado'}</p>
          <p><strong className="font-medium text-foreground">Servicio:</strong> {service || title || '(Sin título)'}</p>
          <p><strong className="font-medium text-foreground">Teléfono:</strong> {clientPhone || 'No especificado'}</p>
          <p><strong className="font-medium text-foreground">Hora:</strong> {start.toFormat('HH:mm')} - {end.toFormat('HH:mm')}</p>
        </div>
      </div>
    </div>
  );
}
