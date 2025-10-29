import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { kpiData, dailyActivity } from '@/lib/placeholder-data';
import { TrendingUp, MessageSquare, Users, Percent } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AnalyticsClient } from '@/components/dashboard/analytics-client';
import { TrendsChart } from '@/components/dashboard/trends-chart';

const activityColors: { [key: string]: string } = {
  confirmation: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300',
  inquiry: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300',
  payment: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300',
};

export default function AnalyticsPage() {
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
            <TrendsChart />
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
                    {day.activities.map(activity => (
                      <div key={activity.time} className="flex items-start gap-3">
                        <div className="text-xs text-muted-foreground w-16 text-right pt-1">{activity.time}</div>
                        <div className="flex-1">
                           <Badge variant="outline" className={`font-normal ${activityColors[activity.type]}`}>{activity.user}</Badge>
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
