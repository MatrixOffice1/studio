'use server';

import { MessagesClientPage } from '@/components/dashboard/messages-client-page';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

async function getInitialMessagesData() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: chatsData, error: chatsError } = await supabase
    .from('chats_v')
    .select('*')
    .order('last_message_at', { ascending: false });

  if (chatsError) {
    console.error('Error fetching chats on server:', chatsError.message);
    // Return an error state
    return { error: `No se pudieron cargar los chats: ${chatsError.message}` };
  }

  return { chats: chatsData || [] };
}

export default async function DashboardMessagesPage() {
  const initialData = await getInitialMessagesData();

  if ('error' in initialData) {
    // You can render a dedicated error component here
    return <div className="p-4 text-red-500">{initialData.error}</div>;
  }

  return <MessagesClientPage initialChats={initialData.chats} />;
}
