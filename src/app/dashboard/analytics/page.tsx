'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { subDays, format } from 'date-fns';
import { AnalyticsClientPage } from '@/components/dashboard/analytics-client-page';
import { Card, CardContent, CardTitle } from '@/components/ui/card';

type RawReservation = {
  "from": "whatsapp" | "telefono" | string;
};

const SHEET_WEBHOOK_URL = 'https://n8n.srv1002935.hstgr.cloud/webhook/sheet';

async function getAnalyticsData() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

    const allDailyDataPromise = supabase.from('messages_daily_v').select('total');
    const last7DaysPromise = supabase.from('messages_daily_v').select('*').gte('day', sevenDaysAgo);
    const reservationResponsePromise = fetch(SHEET_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cb: Date.now() }),
    });

    const [
      { data: allDailyData, error: allDailyError },
      { data: last7Days, error: last7DaysError },
      reservationResponse
    ] = await Promise.all([
      allDailyDataPromise,
      last7DaysPromise,
      reservationResponsePromise
    ]);

    if (allDailyError || last7DaysError) {
      throw new Error(allDailyError?.message || last7DaysError?.message || "Error fetching Supabase data");
    }

    const reservations: RawReservation[] = reservationResponse.ok ? await reservationResponse.json() : [];
    
    return { allDailyData, last7Days, reservations };

  } catch (err: any) {
    console.error("Error fetching analytics data on server:", err);
    return { error: err.message };
  }
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  if ('error' in data && data.error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card className="flex-1 flex items-center justify-center bg-destructive/10 border-destructive">
          <CardContent className="text-center text-destructive p-6">
            <CardTitle>Error de Carga</CardTitle>
            <p>{data.error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AnalyticsClientPage initialData={data} />;
}
