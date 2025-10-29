import { AppointmentsCalendar } from '@/components/dashboard/appointments-calendar';

export default function AppointmentsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-headline font-bold">Appointments</h1>
        <p className="text-muted-foreground">Schedule and manage client appointments.</p>
      </header>
      <AppointmentsCalendar />
    </div>
  );
}
