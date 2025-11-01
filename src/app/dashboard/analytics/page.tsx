
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, MessageSquare, Users, Percent, Phone } from 'lucide-react';
import { AnalyticsClient } from '@/components/dashboard/analytics-client';
import { TrendsChart } from '@/components/dashboard/trends-chart';
import { supabase } from '@/lib/supabase';
import { subDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DateTime } from 'luxon';

type RawReservation = {
  "from": "whatsapp" | "telefono" | string;
};

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" {...props}>
        <path fill="currentColor" d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5c0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
    </svg>
);

const SHEET_WEBHOOK_URL = 'https://n8n.srv1002935.hstgr.cloud/webhook/sheet';

async function getAnalyticsData() {
  const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

  // Fetch all daily data for all-time stats
  const { data: allDailyData, error: allDailyError } = await supabase
    .from('messages_daily_v')
    .select('total');

  // Fetch last 7 days for trend
  const { data: last7Days, error: last7DaysError } = await supabase
    .from('messages_daily_v')
    .select('*')
    .gte('day', sevenDaysAgo);
    
  // Fetch reservations for channel analytics
  const reservationResponse = await fetch(SHEET_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cb: Date.now() }),
  });
  
  const reservations: RawReservation[] = reservationResponse.ok ? await reservationResponse.json() : [];
  
  let channelAnalytics = { total: 0, fromWhatsapp: 0, fromTelefono: 0 };
  if (reservations.length > 0) {
      const fromWhatsapp = reservations.filter(r => r.from?.toLowerCase() === 'whatsapp').length;
      channelAnalytics = {
          total: reservations.length,
          fromWhatsapp,
          fromTelefono: reservations.length - fromWhatsapp
      };
  }

  if (allDailyError || last7DaysError) {
    console.error('Error fetching Supabase data:', allDailyError || last7DaysError);
    return {
      kpiData: {
        totalMessages: 0,
        avgDailyComm: 0,
        incomingPercentage: 0,
        last7DaysTrend: [],
      },
      channelAnalytics,
    };
  }

  const totalMessagesAllTime = allDailyData ? allDailyData.reduce((acc, row) => acc + (row.total || 0), 0) : 0;
  
  const last7DaysData = last7Days || [];
  const totalMessages7Days = last7DaysData.reduce((acc, row) => acc + (row.total || 0), 0);
  const totalInbound7Days = last7DaysData.reduce((acc, row) => acc + (row.inbound || 0), 0);
  
  const incomingPercentage = totalMessages7Days > 0 ? Math.round((totalInbound7Days / totalMessages7Days) * 100) : 0;
  const avgDailyComm = last7DaysData.length > 0 ? Math.round(totalMessages7Days / last7DaysData.length) : 0;

  const dateMap = new Map<string, number>();
  last7DaysData.forEach(row => {
    dateMap.set(row.day, row.total);
  });

  const last7DaysTrend = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), i);
    const dayKey = format(date, 'yyyy-MM-dd');
    const dayName = format(date, 'EEE', { locale: es });
    return {
      day: dayName.charAt(0).toUpperCase() + dayName.slice(1, 3),
      messages: dateMap.get(dayKey) || 0,
    };
  }).reverse();

  return {
    kpiData: {
      totalMessages: totalMessagesAllTime,
      avgDailyComm,
      incomingPercentage,
      last7DaysTrend,
    },
    channelAnalytics,
  };
}


export default async function AnalyticsPage() {
  const { kpiData, channelAnalytics } = await getAnalyticsData();

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-headline font-bold">Analíticas</h1>
        <p className="text-muted-foreground">Insights sobre la comunicación con tus clientes.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensajes Totales</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.totalMessages}</div>
            <p className="text-xs text-muted-foreground">Desde el inicio</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prom. Com. Diaria</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.avgDailyComm}</div>
            <p className="text-xs text-muted-foreground">Últimos 7 días</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">% Entrantes</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.incomingPercentage}%</div>
            <p className="text-xs text-muted-foreground">En los últimos 7 días</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tendencia 7 Días</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">Positiva</div>
            <p className="text-xs text-muted-foreground">La actividad aumenta</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reservas Totales</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{channelAnalytics.total}</div>
              <p className="text-xs text-muted-foreground">Desde el inicio</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reservas por WhatsApp</CardTitle>
              <WhatsAppIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{channelAnalytics.fromWhatsapp}</div>
              <p className="text-xs text-muted-foreground">Desde el inicio</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reservas por Teléfono</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{channelAnalytics.fromTelefono}</div>
              <p className="text-xs text-muted-foreground">Desde el inicio</p>
            </CardContent>
          </Card>
      </section>

      <div className="grid gap-8 lg:grid-cols-1">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Tendencia de los últimos 7 días</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <TrendsChart data={kpiData.last7DaysTrend} />
          </CardContent>
        </Card>
      </div>
      
      <AnalyticsClient />

    </div>
  );
}
