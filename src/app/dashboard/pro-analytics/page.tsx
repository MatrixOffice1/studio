
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { DateTime } from 'luxon';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, RefreshCw, Phone, BarChart, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';
import { ResponsiveContainer, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Pie, Cell, Legend } from 'recharts';

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" {...props}>
        <path fill="currentColor" d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5c0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
    </svg>
);

type RawReservation = {
  "Nombre completo": string;
  "Fecha y hora": string;
  "from": "whatsapp" | "telefono" | string;
};

type ProcessedReservation = {
  date: DateTime;
  from: "whatsapp" | "telefono";
};

const SHEET_WEBHOOK_URL = 'https://n8n.srv1002935.hstgr.cloud/webhook/sheet';
const PIE_CHART_COLORS = { whatsapp: '#25D366', telefono: '#3b82f6' };

function KpiCard({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: React.ElementType, color?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" style={{ color }} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export default function ProAnalyticsPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [reservations, setReservations] = useState<ProcessedReservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseDate = (dateString: string): DateTime => {
    let dt = DateTime.fromFormat(dateString, 'dd/MM/yyyy HH:mm:ss', { zone: 'Europe/Madrid' });
    if (dt.isValid) return dt;
    dt = DateTime.fromFormat(dateString, 'd/M/yyyy HH:mm:ss', { zone: 'Europe/Madrid' });
    if (dt.isValid) return dt;
    dt = DateTime.fromSQL(dateString, { zone: 'Europe/Madrid' });
    return dt;
  };

  const fetchReservations = useCallback(async (isManualSync = false) => {
    if (!profile?.is_admin) {
      setIsLoading(false);
      return;
    }

    if (!SHEET_WEBHOOK_URL) {
      setError("La URL del webhook no está configurada.");
      if (isManualSync) setIsSyncing(false); else setIsLoading(false);
      return;
    }

    if (isManualSync) setIsSyncing(true); else setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(SHEET_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cb: Date.now() }),
      });

      if (!response.ok) throw new Error(`Error de red: ${response.statusText}`);
      
      const data: RawReservation[] = await response.json();
      
      const processed = data
        .map(r => {
            const from = r.from?.toLowerCase() === 'whatsapp' ? 'whatsapp' : 'telefono';
            const date = parseDate(r["Fecha y hora"]);
            return { from, date };
        })
        .filter(r => r.date.isValid) as ProcessedReservation[];

      setReservations(processed);

      if (isManualSync) {
        toast({ title: "Sincronizado", description: "Los datos de analíticas han sido actualizados." });
      }

    } catch (err: any) {
      setError(`Error al cargar los datos: ${err.message}`);
      if(isManualSync) {
        toast({ variant: 'destructive', title: 'Error de Sincronización', description: err.message });
      }
    } finally {
      if (isManualSync) setIsSyncing(false); else setIsLoading(false);
    }
  }, [toast, profile]);
  
  useEffect(() => {
    if(profile?.is_admin) {
        fetchReservations(false);
    } else {
        setIsLoading(false);
    }
  }, [fetchReservations, profile]);

  const analyticsData = useMemo(() => {
    if (reservations.length === 0) {
      return { total: 0, fromWhatsapp: 0, fromTelefono: 0, pieData: [], barData: [] };
    }

    const fromWhatsapp = reservations.filter(r => r.from === 'whatsapp').length;
    const fromTelefono = reservations.length - fromWhatsapp;

    const pieData = [
      { name: 'WhatsApp', value: fromWhatsapp, fill: PIE_CHART_COLORS.whatsapp },
      { name: 'Teléfono', value: fromTelefono, fill: PIE_CHART_COLORS.telefono },
    ];
    
    const thirtyDaysAgo = DateTime.now().minus({ days: 30 }).startOf('day');
    const dailyCounts = reservations
        .filter(r => r.date >= thirtyDaysAgo)
        .reduce((acc, r) => {
            const day = r.date.toISODate();
            if (!day) return acc;
            if (!acc[day]) acc[day] = { date: day, whatsapp: 0, telefono: 0 };
            acc[day][r.from]++;
            return acc;
        }, {} as Record<string, {date: string, whatsapp: number, telefono: number}>);

    const barData = Object.values(dailyCounts).sort((a,b) => a.date.localeCompare(b.date));

    return {
      total: reservations.length,
      fromWhatsapp,
      fromTelefono,
      pieData,
      barData,
    };
  }, [reservations]);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile?.is_admin) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card className="flex-1 flex items-center justify-center bg-destructive/10 border-destructive">
          <CardContent className="text-center text-destructive p-6">
            <CardTitle>Acceso Denegado</CardTitle>
            <p>No tienes permiso para ver esta sección.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error && reservations.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card className="flex-1 flex items-center justify-center bg-destructive/10 border-destructive">
          <CardContent className="text-center text-destructive p-6">
            <CardTitle>Error de Carga</CardTitle>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <header className="flex justify-between items-start">
        <div>
            <h1 className="text-2xl sm:text-3xl font-headline font-bold">Analítica PRO</h1>
            <p className="text-muted-foreground">Rendimiento de los canales de captación de citas.</p>
        </div>
        <Button onClick={() => fetchReservations(true)} disabled={isSyncing}>
            {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Sincronizar
        </Button>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
          <KpiCard title="Reservas Totales" value={analyticsData.total} icon={BarChart} />
          <KpiCard title="Reservas por WhatsApp" value={analyticsData.fromWhatsapp} icon={WhatsAppIcon} color={PIE_CHART_COLORS.whatsapp} />
          <KpiCard title="Reservas por Teléfono" value={analyticsData.fromTelefono} icon={Phone} color={PIE_CHART_COLORS.telefono} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Distribución de Canales</CardTitle>
            <CardDescription>Comparativa de reservas por canal.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analyticsData.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {analyticsData.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Tendencia de Reservas por Canal</CardTitle>
            <CardDescription>Volumen de reservas diarias en los últimos 30 días.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(str) => DateTime.fromISO(str).toFormat('dd-MM')} />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="whatsapp" name="WhatsApp" fill={PIE_CHART_COLORS.whatsapp} stackId="a" />
                <Bar dataKey="telefono" name="Teléfono" fill={PIE_CHART_COLORS.telefono} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
