import { Messages } from '@/components/dashboard/messages';

export default function DashboardPage() {
  return (
    <div className="h-screen flex flex-col">
       <div className="flex-grow overflow-hidden">
        <Messages />
       </div>
    </div>
  );
}
