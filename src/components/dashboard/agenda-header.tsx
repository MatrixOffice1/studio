'use client';

import { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { es } from 'date-fns/locale';

type AgendaHeaderProps = {
  currentDate: DateTime;
  setCurrentDate: (date: DateTime) => void;
  isAutoSyncEnabled: boolean;
  setIsAutoSyncEnabled: (enabled: boolean) => void;
  onSync: () => void;
  isSyncing: boolean;
  onAddAppointment: () => void;
};

export function AgendaHeader({ 
  currentDate, 
  setCurrentDate, 
  isAutoSyncEnabled, 
  setIsAutoSyncEnabled,
  onSync,
  isSyncing,
  onAddAppointment
}: AgendaHeaderProps) {
  const [time, setTime] = useState(DateTime.now().setZone('Europe/Madrid'));

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(DateTime.now().setZone('Europe/Madrid'));
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setCurrentDate(DateTime.fromJSDate(date).setZone('Europe/Madrid'));
    }
  };

  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="flex items-center gap-4">
        <div className="bg-foreground text-background rounded-lg px-4 py-2 text-center">
          <p className="text-2xl font-bold font-mono tracking-wider">{time.toFormat('HH:mm:ss')}</p>
          <p className="text-xs opacity-80">Hora Peninsular</p>
        </div>
        <Button onClick={onAddAppointment}>
          <Plus className="mr-2 h-4 w-4" />
          Añadir Cita
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[200px] justify-start text-left font-normal",
                !currentDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {currentDate ? currentDate.setLocale('es').toFormat('dd LLLL yyyy') : <span>Elige una fecha</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={currentDate.toJSDate()}
              onSelect={handleDateSelect}
              initialFocus
              locale={es}
            />
          </PopoverContent>
        </Popover>

        <Button variant="outline" size="icon" onClick={() => setCurrentDate(currentDate.minus({ days: 1 }))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={() => setCurrentDate(DateTime.now().setZone('Europe/Madrid'))}>Hoy</Button>
        <Button variant="outline" size="icon" onClick={() => setCurrentDate(currentDate.plus({ days: 1 }))}>
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button onClick={onSync} disabled={isSyncing}>
          {isSyncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sincronizar
        </Button>

        <div className="flex items-center space-x-2">
          <Switch 
            id="autosync-switch" 
            checked={isAutoSyncEnabled}
            onCheckedChange={setIsAutoSyncEnabled}
          />
          <Label htmlFor="autosync-switch">Sinc. Automática</Label>
        </div>
      </div>
    </header>
  );
}
