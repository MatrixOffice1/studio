import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, MessageSquare, Users, Percent } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AnalyticsClient } from '@/components/dashboard/analytics-client';
import { TrendsChart } from '@/components/dashboard/trends-chart';
import { supabase } from '@/lib/supabase';
import { subDays, format, parseISO, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';

const activityColors: { [key: string]: string } = {
  confirmation: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300',
  inquiry: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300',
  payment: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300',
  default: 'bg-gray-100 dark:bg-gray-900/50 text-gray-800 dark:text-gray-300',
};

function classifyMessage(message: string): string {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('confirm')) return 'confirmation';
    if (lowerMessage.includes('información') || lowerMessage.includes('saber') || lowerMessage.includes('disponibilidad')) return 'inquiry';
    if (lowerMessage.includes('pago') || lowerMessage.includes('comprobante')) return 'payment';
    return 'default';
}

async function getAnalyticsData() {
  const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

  // Fetch all daily data for all-time stats
  const { data: allDailyData, error: allDailyError } = await supabase
    .from('messages_daily_v')
    .select('*');

  // Fetch last 7 days for trend
  const { data: last7Days, error: last7DaysError } = await supabase
    .from('messages_daily_v')
    .select('*')
    .gte('day', sevenDaysAgo);
    
  const { data: chatsData, error: chatsError } = await supabase.from('chats_v').select('*');

  if (allDailyError || last7DaysError || chatsError) {
    console.error('Error fetching Supabase data:', allDailyError || last7DaysError || chatsError);
    return {
      kpiData: {
        totalMessages: 0,
        avgDailyComm: 0,
        incomingPercentage: 0,
        last7DaysTrend: [],
      },
      dailyActivity: [],
    };
  }
  
  const chats = chatsData.filter(chat => chat.created_at);

  const totalMessagesAllTime = allDailyData.reduce((acc, row) => acc + row.total, 0);
  const totalMessages7Days = last7Days.reduce((acc, row) => acc + row.total, 0);
  const totalInbound7Days = last7Days.reduce((acc, row) => acc + row.inbound, 0);
  
  const incomingPercentage = totalMessages7Days > 0 ? Math.round((totalInbound7Days / totalMessages7Days) * 100) : 0;
  const avgDailyComm = last7Days.length > 0 ? Math.round(totalMessages7Days / last7Days.length) : 0;

  const dateMap = new Map<string, number>();
  last7Days.forEach(row => {
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

  const activityByDate = chats.reduce((acc, chat) => {
      const chatDate = parseISO(chat.created_at);
      let dateLabel;
      if (isToday(chatDate)) {
        dateLabel = `Hoy, ${format(chatDate, 'dd \'de\' MMMM', { locale: es })}`;
      } else if (isYesterday(chatDate)) {
        dateLabel = `Ayer, ${format(chatDate, 'dd \'de\' MMMM', { locale: es })}`;
      } else {
        dateLabel = format(chatDate, 'eeee, dd \'de\' MMMM', { locale: es });
        dateLabel = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);
      }
      
      if (!acc[dateLabel]) {
        acc[dateLabel] = [];
      }
      
      acc[dateLabel].push({
        time: format(chatDate, 'p', { locale: es }),
        user: chat.contact_name,
        description: chat.message,
        type: classifyMessage(chat.message),
        created_at: chat.created_at
      });
      return acc;
  }, {} as Record<string, any[]>);

  const dailyActivity = Object.entries(activityByDate).map(([date, activities]) => ({
      date,
      activities: activities.sort((a,b) => parseISO(b.created_at).getTime() - parseISO(a.created_at).getTime())
  })).sort((a,b) => {
      const dateA = a.activities[0]?.created_at;
      const dateB = b.activities[0]?.created_at;
      
      if (!dateA || !dateB) return 0;

      return parseISO(dateB).getTime() - parseISO(dateA).getTime();
  });


  return {
    kpiData: {
      totalMessages: totalMessagesAllTime,
      avgDailyComm,
      incomingPercentage,
      last7DaysTrend,
    },
    dailyActivity,
  };
}


export default async function AnalyticsPage() {
  const { kpiData } = await getAnalyticsData();

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
