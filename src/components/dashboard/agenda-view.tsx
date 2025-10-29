'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { DateTime } from 'luxon';
import { useUserSettings } from '@/hooks/use-user-settings';
import { AgendaHeader } from './agenda-header';
import { AgendaKpiCards } from './agenda-kpi-cards';
import { AgendaTimeline } from './agenda-timeline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { generateAgendaAnalysis } from '@/ai/flows/generate-agenda-analysis';
import { AnalysisParser } from './analysis-parser';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AppointmentDetails } from './appointment-details';
import { AppointmentCard } from './appointment-card';


export type CalendarEvent = {
  uid: string;
  start: DateTime;
  end: DateTime;
  title: string;
  clientName?: string;
  clientPhone?: string;
  status: string;
  service?: string;
  professional: string;
  description?: string;
};

const PROFESSIONALS = ['Ana', 'Joana', 'Maria'];

export function AgendaView() {
  const { settings } = useUserSettings();
  const { toast } = useToast();
  
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(DateTime.now().setZone('Europe/Madrid'));
  const [agendaLoading, setAgendaLoading] = useState(false);
  const [agendaError, setAgendaError] = useState<string | null>(null);
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(() => {
    // Check localStorage only on the client-side
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('isAutoSyncEnabled');
      return savedState ? JSON.parse(savedState) : false;
    }
    return false;
  });
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [isSyncing, setIsSyncing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);


  const fetchCalendarEvents = useCallback(async (isManualSync = false) => {
    const webhookUrl = settings?.n8n_webhook_url;

    if (!webhookUrl) {
      setAgendaError("Por favor, configure una URL de Webhook en la sección de Ajustes.");
      return;
    }

    if (isSyncing && !isManualSync) return;
    
    setIsSyncing(true);
    if (!isManualSync) {
      setAgendaLoading(true);
    }
    setAgendaError(null);
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          day: DateTime.now().setZone('Europe/Madrid').toISODate(), 
          cb: Date.now() 
        })
      });
      
      if (!response.ok) throw new Error(`Error de red: ${response.statusText}`);
      const data = await response.json();

      if (data.ok && Array.isArray(data.items)) {
        const processed = data.items.map((ev: any) => ({
          ...ev,
          start: DateTime.fromISO(ev.start, { zone: 'Europe/Madrid' }),
          end: DateTime.fromISO(ev.end, { zone: 'Europe/Madrid' }),
          uid: ev.id,
        }));
        setAllEvents(processed);
      } else {
        setAllEvents([]);
      }
    } catch (err: any) {
      setAgendaError(`Error al cargar la agenda: ${err.message}`);
      setAllEvents([]);
      if (isManualSync) {
        toast({
          variant: 'destructive',
          title: 'Error de Sincronización',
          description: `No se pudo cargar la agenda: ${err.message}`
        });
      }
    } finally {
      setIsSyncing(false);
      setAgendaLoading(false);
    }
  }, [settings, isSyncing, toast]);
  
  useEffect(() => {
    fetchCalendarEvents(true);
  }, [settings?.n8n_webhook_url]); // Fetch on initial load/webhook URL change

  // Persist the auto-sync state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('isAutoSyncEnabled', JSON.stringify(isAutoSyncEnabled));
    }
  }, [isAutoSyncEnabled]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (isAutoSyncEnabled && settings?.sync_interval && settings.sync_interval > 0) {
        intervalId = setInterval(() => {
            fetchCalendarEvents(false);
        }, settings.sync_interval * 60 * 1000);
    }
    return () => {
        if (intervalId) clearInterval(intervalId);
    };
}, [isAutoSyncEnabled, settings?.sync_interval, fetchCalendarEvents]);


  const eventsForSelectedDay = useMemo(() => {
    return allEvents
      .filter(event => event.start.hasSame(currentDate, 'day'))
      .sort((a,b) => a.start.toMillis() - b.start.toMillis());
  }, [allEvents, currentDate]);

  const { pastEvents, upcomingEvents } = useMemo(() => {
    const now = DateTime.now().setZone('Europe/Madrid');
    return eventsForSelectedDay.reduce((acc, event) => {
      if (event.end < now) {
        acc.pastEvents.push(event);
      } else {
        acc.upcomingEvents.push(event);
      }
      return acc;
    }, { pastEvents: [] as CalendarEvent[], upcomingEvents: [] as CalendarEvent[] });
  }, [eventsForSelectedDay]);

  const eventsForNext7Days = useMemo(() => {
    const today = DateTime.now().setZone('Europe/Madrid').startOf('day');
    const sevenDaysFromNow = today.plus({ days: 7 });
    return allEvents.filter(event => event.start >= today && event.start < sevenDaysFromNow);
  }, [allEvents]);

  const professionalsToDisplay = useMemo(() => {
    if (activeFilter === 'Todos') {
      return PROFESSIONALS;
    }
    return [activeFilter];
  }, [activeFilter]);
  
  const agendaStats = useMemo(() => {
    const events = eventsForSelectedDay;
    if (!events || events.length === 0) {
      return { total: 0, completed: 0, pending: 0, next7Days: eventsForNext7Days.length };
    }
    
    const now = DateTime.now().setZone('Europe/Madrid');
    const completed = events.filter(ev => ev.end <= now).length;
    const pending = events.length - completed;
    
    return {
      total: events.length,
      completed: completed,
      pending: pending,
      next7Days: eventsForNext7Days.length,
    };
  }, [eventsForSelectedDay, eventsForNext7Days]);

  const handleAnalyzeWeek = async () => {
    setIsAnalyzing(true);
    setAnalysisResult('');
    try {
      if (eventsForNext7Days.length === 0) {
        setAnalysisResult('No hay citas en los próximos 7 días para analizar.');
        setIsAnalysisModalOpen(true);
        return;
      }
  
      const dataSummary = eventsForNext7Days.map(ev => {
        return `- ${ev.start.setLocale('es').toFormat('cccc dd')}: ${ev.service || ev.title} con ${ev.professional} a las ${ev.start.toFormat('HH:mm')}`;
      }).join('\n');
      
      const result = await generateAgendaAnalysis({ dataSummary });
      setAnalysisResult(result.analysis);
      setIsAnalysisModalOpen(true);

    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Error de Análisis',
        description: `No se pudo generar el análisis: ${e.message}`
      });
    } finally {
      setIsAnalyzing(false);
    }
  };


  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 flex flex-col h-full bg-muted/20">
      <AgendaHeader 
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        isAutoSyncEnabled={isAutoSyncEnabled}
        setIsAutoSyncEnabled={setIsAutoSyncEnabled}
        onSync={() => fetchCalendarEvents(true)}
        isSyncing={isSyncing}
      />
      <AgendaKpiCards stats={agendaStats} />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Button 
                size="sm" 
                variant={activeFilter === 'Todos' ? 'default' : 'outline'}
                onClick={() => setActiveFilter('Todos')}
              >
                Todos
              </Button>
              {PROFESSIONALS.map(prof => (
                <Button 
                  key={prof} 
                  size="sm" 
                  variant={activeFilter === prof ? 'default' : 'outline'}
                  onClick={() => setActiveFilter(prof)}
                >
                  {prof}
                </Button>
              ))}
            </div>
            <Button onClick={handleAnalyzeWeek} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analizando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" /> Analizar Próximos 7 Días con IA
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {agendaLoading ? (
         <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
         </div>
      ) : agendaError ? (
        <Card className="flex-1 flex items-center justify-center">
            <CardContent className="text-center text-destructive">
                <CardTitle>Error</CardTitle>
                <p>{agendaError}</p>
            </CardContent>
        </Card>
      ) : (
        <AgendaTimeline 
            events={eventsForSelectedDay.filter(ev => activeFilter === 'Todos' || ev.professional === activeFilter)} 
            professionals={professionalsToDisplay}
            onEventClick={setSelectedEvent}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Próximas Citas del Día</h3>
          <div className="space-y-4">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map(event => (
                <AppointmentCard key={event.uid} event={event} onEventClick={setSelectedEvent} />
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No hay próximas citas para hoy.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">Citas Pasadas del Día</h3>
          <div className="space-y-4">
            {pastEvents.length > 0 ? (
              pastEvents.map(event => (
                <AppointmentCard key={event.uid} event={event} isPast onEventClick={setSelectedEvent} />
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No hay citas pasadas para hoy.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isAnalysisModalOpen} onOpenChange={setIsAnalysisModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="text-accent" /> Análisis de la Próxima Semana</DialogTitle>
            <DialogDescription>
              Resumen de la agenda de los próximos 7 días generado por IA.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto">
            <AnalysisParser content={analysisResult} />
          </div>
          <div className="flex justify-end">
              <Button onClick={() => setIsAnalysisModalOpen(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedEvent} onOpenChange={(isOpen) => !isOpen && setSelectedEvent(null)}>
        <DialogContent className="max-w-lg">
            <DialogHeader>
                <DialogTitle>Detalles de la Cita</DialogTitle>
            </DialogHeader>
            <AppointmentDetails event={selectedEvent} />
            <div className="flex justify-end">
                <Button variant="outline" onClick={() => setSelectedEvent(null)}>Cerrar</Button>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
