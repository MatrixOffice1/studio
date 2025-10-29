'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { DateTime } from 'luxon';

const PROFESSIONALS = [
  { name: 'Ana', color: '#ef4444' },
  { name: 'Joana', color: '#22c55e' },
  { name: 'Maria', color: '#3b82f6' },
];

const WEBHOOK_URL = 'https://n8n.srv1002935.hstgr.cloud/webhook-test/calendar-tony-airmate';

type ProfessionalAvailabilityProps = {
  currentDate: DateTime;
};

export function ProfessionalAvailability({ currentDate }: ProfessionalAvailabilityProps) {
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    // Reset availability when the date changes
    setAvailability({});
  }, [currentDate]);

  const handleToggle = async (professionalName: string) => {
    setLoading(prev => ({ ...prev, [professionalName]: true }));

    const isCurrentlyPresent = availability[professionalName] !== false; // Default to present
    const newStatus = isCurrentlyPresent ? 'absent' : 'present';

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professional: professionalName,
          date: currentDate.toISODate(),
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error(`El webhook devolvió el estado ${response.status}`);
      }

      // Update UI state only on successful webhook call
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Disponibilidad de Profesionales</CardTitle>
        <CardDescription>
          Activa o desactiva para marcar a un profesional como ausente o presente para el día seleccionado.
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
              disabled={isLoading}
              variant={isPresent ? 'default' : 'destructive'}
              style={{
                '--prof-color': prof.color,
                backgroundColor: isPresent ? prof.color : undefined,
              } as React.CSSProperties}
              className={cn(
                'text-white transition-all duration-200',
                !isPresent && 'bg-opacity-20 text-foreground border-destructive hover:bg-destructive hover:text-destructive-foreground'
              )}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                 <span
                    className={cn(
                        "mr-2 h-3 w-3 rounded-full transition-colors",
                        isPresent ? 'bg-green-300' : 'bg-gray-400'
                    )}
                 />
              )}
              {prof.name}: {isPresent ? 'Presente' : 'Ausente'}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
