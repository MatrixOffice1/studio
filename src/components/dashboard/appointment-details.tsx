'use client';

import type { CalendarEvent } from './agenda-view';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Phone, User, Calendar, Clock, Info, StickyNote, Tag } from 'lucide-react';
import { DateTime } from 'luxon';

interface AppointmentDetailsProps {
  event: CalendarEvent | null;
}

export function AppointmentDetails({ event }: AppointmentDetailsProps) {
  if (!event) return null;

  const { title, service, professional, clientName, clientPhone, start, end, status } = event;
  
  const isPast = end < DateTime.now();

  const getStatusInfo = () => {
    if (status?.toLowerCase() === 'cancelled') {
        return { text: 'Cancelada', className: 'bg-red-100 text-red-800' };
    }
    if (isPast) {
        return { text: 'Completada', className: 'bg-gray-100 text-gray-800' };
    }
    return { text: 'Confirmada', className: 'bg-green-100 text-green-800' };
  };

  const statusInfo = getStatusInfo();
  const formattedDate = start.setLocale('es').toFormat("cccc, dd 'de' LLLL 'de' yyyy");
  const formattedTime = `${start.toFormat('HH:mm')} - ${end.toFormat('HH:mm')}`;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold text-foreground">{service || title}</h3>
        <p className="text-muted-foreground">con {professional}</p>
      </div>

      <Separator />

      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-3">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">Cliente:</span>
          <span>{clientName || 'No especificado'}</span>
        </div>
        <div className="flex items-center gap-3">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">Servicio:</span>
          <span>{service || title}</span>
        </div>
        <div className="flex items-center gap-3">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">Teléfono:</span>
          {clientPhone ? (
            <a href={`tel:${clientPhone}`} className="text-primary hover:underline">{clientPhone}</a>
          ) : (
            <span>No especificado</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">Fecha:</span>
          <span className="capitalize">{formattedDate}</span>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">Hora:</span>
          <span>{formattedTime}</span>
        </div>
         <div className="flex items-center gap-3">
          <Info className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">Estado:</span>
          <Badge variant="outline" className={`font-medium ${statusInfo.className}`}>{statusInfo.text}</Badge>
        </div>
      </div>
      
      {event.description && (
          <>
            <Separator />
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <StickyNote className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-semibold">Notas:</h4>
                </div>
                <div className="p-3 bg-muted/50 rounded-md text-sm text-muted-foreground">
                    <p>{event.description}</p>
                </div>
            </div>
          </>
      )}

    </div>
  );
}
