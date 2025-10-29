'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { DateTime } from 'luxon';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserSettings } from '@/hooks/use-user-settings';
import type { CalendarEvent } from './agenda-view';
import { PROFESSIONALS } from './agenda-view';

const appointmentFormSchema = z.object({
  clientName: z.string().min(1, { message: 'El nombre del cliente es obligatorio.' }),
  service: z.string().min(1, { message: 'El servicio es obligatorio.' }),
  professional: z.string().min(1, { message: 'Debes seleccionar un profesional.' }),
  startTime: z.string().regex(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Hora de inicio inválida (HH:mm).' }),
  endTime: z.string().regex(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Hora de fin inválida (HH:mm).' }),
}).refine(data => data.startTime < data.endTime, {
  message: 'La hora de fin debe ser posterior a la de inicio.',
  path: ['endTime'],
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

interface AppointmentFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAppointmentCreated: (event: Omit<CalendarEvent, 'uid' | 'status'>) => void;
  currentDate: DateTime;
}

export function AppointmentForm({ isOpen, onOpenChange, onAppointmentCreated, currentDate }: AppointmentFormProps) {
  const { settings } = useUserSettings();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      clientName: '',
      service: '',
      professional: '',
      startTime: '10:00',
      endTime: '11:00',
    },
  });
  
  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  const onSubmit = async (values: AppointmentFormValues) => {
    if (!settings?.citas_webhook_url) {
      toast({
        variant: 'destructive',
        title: 'Error de Configuración',
        description: 'Falta la URL del webhook de citas en los ajustes.',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    const startDateTime = currentDate.set({ 
      hour: parseInt(values.startTime.split(':')[0]), 
      minute: parseInt(values.startTime.split(':')[1]),
    });
    const endDateTime = currentDate.set({ 
      hour: parseInt(values.endTime.split(':')[0]), 
      minute: parseInt(values.endTime.split(':')[1]),
    });

    const newEventData = {
      clientName: values.clientName,
      service: values.service,
      title: values.service,
      professional: values.professional,
      start: startDateTime,
      end: endDateTime,
    };
    
    try {
        await fetch(settings.citas_webhook_url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                action: 'create',
                event: {
                    ...newEventData,
                    start: newEventData.start.toISO(),
                    end: newEventData.end.toISO(),
                }
            }),
        });

      onAppointmentCreated(newEventData);
      form.reset();
    } catch(error: any) {
        toast({
            variant: 'destructive',
            title: 'Error al Crear Cita',
            description: `No se pudo enviar al webhook: ${error.message}`,
        });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Nueva Cita</DialogTitle>
          <DialogDescription>
            Completa los detalles para crear una nueva cita para el {currentDate.setLocale('es').toFormat("dd 'de' LLLL")}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Cliente</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Maria Lopez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="service"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Servicio</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Corte y Peinado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="professional"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profesional</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un profesional" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PROFESSIONALS.map(prof => (
                        <SelectItem key={prof} value={prof}>{prof}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desde</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hasta</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Cita
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
