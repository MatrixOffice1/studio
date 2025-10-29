import { Messages } from '@/components/dashboard/messages';

export default function DashboardPage() {
  return (
    <div className="h-screen flex flex-col">
       <header className="p-4 border-b">
         <h1 className="text-2xl font-headline font-bold">WhatsApp Conversations</h1>
       </header>
       <div className="flex-grow overflow-hidden">
        <Messages />
       </div>
    </div>
  );
}
