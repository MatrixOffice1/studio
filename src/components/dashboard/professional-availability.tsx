
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { DateTime } from 'luxon';
import { useAuth } from '@/providers/auth-provider';

const PROFESSIONALS = [
  { name: 'Ana', color: '#ef4444' },
  { name: 'Joana', color: '#22c55e' },
  { name: 'Maria', color: '#3b82f6' },
];

type ProfessionalAvailabilityProps = {
  currentDate: DateTime;
};

const AVAILABILITY_WEBHOOK_URL = 'https://n8n.srv1002935.hstgr.cloud/webhook/calendar-tony-airmate';

export function ProfessionalAvailability({ currentDate }: ProfessionalAvailabilityProps) {
  const { profile } = useAuth();
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    setAvailability({});
  }, [currentDate]);

  const handleToggle = async (professionalName: string) => {
    if (!AVAILABILITY_WEBHOOK_URL) {
      toast({
        variant: 'destructive',
        title: 'Falta Webhook',
        description: 'La URL del webhook de disponibilidad no está configurada.',
      });
      return;
    }

    setLoading(prev => ({ ...prev, [professionalName]: true }));

    const isCurrentlyPresent = availability[professionalName] !== false;
    const newStatus = isCurrentlyPresent ? 'absent' : 'present';

    const startDateTime = currentDate.set({ hour: 8, minute: 0, second: 0, millisecond: 0 });
    const endDateTime = currentDate.set({ hour: 21, minute: 0, second: 0, millisecond: 0 });

    try {
      await fetch(AVAILABILITY_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          professional: professionalName,
          status: newStatus,
          start: startDateTime.toISO(),
          end: endDateTime.toISO(),
        }),
      });

      setAvailability(prev => ({ ...prev, [professionalName]: newStatus === 'present' }));

      toast({
        title: 'Estado Actualizado',
        description: `${professionalName} ahora está marcada como ${newStatus === 'present' ? 'presente' : 'ausente'} para el ${currentDate.setLocale('es').toFormat('dd LLLL')}.`,
      });
    } catch (error: any) {
      console.error('Error al enviar el webhook:', error);
      toast({
        variant: 'destructive',
        title: 'Error de Red',
        description: `No se pudo actualizar el estado: ${error.message}`,
      });
    } finally {
      setLoading(prev => ({ ...prev, [professionalName]: false }));
    }
  };
  
  const isFeatureDisabled = !AVAILABILITY_WEBHOOK_URL;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Disponibilidad de Profesionales</CardTitle>
        <CardDescription>
          {isFeatureDisabled 
            ? "La URL del webhook de disponibilidad no está configurada."
            : "Activa o desactiva para marcar a un profesional como ausente o presente para el día seleccionado."
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-4">
        {PROFESSIONALS.map(prof => {
          const isPresent = availability[prof.name] !== false;
          const isLoading = loading[prof.name];
          
          return (
            <Button
              key={prof.name}
              onClick={() => handleToggle(prof.name)}
              disabled={isLoading || isFeatureDisabled}
              variant="outline"
              className="transition-all duration-200 border-2"
              style={{ borderColor: prof.color }}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                 <span
                    className={cn(
                        "mr-2 h-3 w-3 rounded-full transition-colors",
                        isPresent ? 'bg-green-500' : 'bg-red-500'
                    )}
                 />
              )}
              <span className="font-bold text-foreground">{prof.name}:</span>
              <span className={cn("ml-1 font-semibold", isPresent ? "text-green-600" : "text-red-600")}>
                {isPresent ? 'Presente' : 'Ausente'}
              </span>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
