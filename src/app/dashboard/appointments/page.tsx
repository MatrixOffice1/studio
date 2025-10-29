import { AgendaView } from '@/components/dashboard/agenda-view';

export default function AppointmentsPage() {
  return (
    <div className="flex-1 flex flex-col h-full bg-muted/20">
      <AgendaView />
    </div>
  );
}
