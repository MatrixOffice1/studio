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
  const { data: chats, error } = await supabase.from('chats_v').select('*');

  if (error) {
    console.error('Error fetching Supabase data:', error);
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

  const totalMessages = chats.length;

  const incomingMessages = chats.filter(c => c.direction === 'incoming').length;
  const incomingPercentage = totalMessages > 0 ? Math.round((incomingMessages / totalMessages) * 100) : 0;

  const today = new Date();
  const dateMap = new Map<string, number>();
  
  chats.forEach(chat => {
    const chatDate = format(parseISO(chat.created_at), 'yyyy-MM-dd');
    dateMap.set(chatDate, (dateMap.get(chatDate) || 0) + 1);
  });
  
  const totalDays = dateMap.size;
  const avgDailyComm = totalDays > 0 ? Math.round(totalMessages / totalDays) : 0;


  const last7DaysTrend = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(today, i);
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
        type: classifyMessage(chat.message)
      });
      return acc;
  }, {} as Record<string, any[]>);

  const dailyActivity = Object.entries(activityByDate).map(([date, activities]) => ({
      date,
      activities: activities.sort((a,b) => parseISO(b.created_at).getTime() - parseISO(a.created_at).getTime())
  })).sort((a,b) => {
      const dateA = Object.values(b.activities)[0].created_at;
      const dateB = Object.values(a.activities)[0].created_at;
      return parseISO(dateA).getTime() - parseISO(dateB).getTime();
  });


  return {
    kpiData: {
      totalMessages,
      avgDailyComm,
      incomingPercentage,
      last7DaysTrend,
    },
    dailyActivity,
  };
}


export default async function AnalyticsPage() {
  const { kpiData, dailyActivity } = await getAnalyticsData();

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-headline font-bold">Analytics</h1>
        <p className="text-muted-foreground">Insights sobre la comunicación con tus clientes.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.totalMessages}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Daily Comm.</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.avgDailyComm}</div>
            <p className="text-xs text-muted-foreground">+12% from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incoming %</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.incomingPercentage}%</div>
            <p className="text-xs text-muted-foreground">vs {100 - kpiData.incomingPercentage}% Outgoing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">7-Day Trend</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">Positive</div>
            <p className="text-xs text-muted-foreground">Activity is increasing</p>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Last 7 Days Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <TrendsChart data={kpiData.last7DaysTrend} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily Activity Feed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dailyActivity.map(day => (
                <div key={day.date}>
                  <h4 className="font-semibold text-sm mb-2">{day.date}</h4>
                  <div className="space-y-3">
                    {day.activities.map((activity, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="text-xs text-muted-foreground w-16 text-right pt-1">{activity.time}</div>
                        <div className="flex-1">
                           <Badge variant="outline" className={`font-normal ${activityColors[activity.type] || activityColors.default}`}>{activity.user}</Badge>
                           <p className="text-sm mt-1">{activity.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <AnalyticsClient />

    </div>
  );
}
