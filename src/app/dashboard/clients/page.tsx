'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useUserSettings } from '@/hooks/use-user-settings';
import { useToast } from '@/hooks/use-toast';
import { DateTime } from 'luxon';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Users, Star, Repeat, Phone, Calendar as CalendarIcon, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';

type RawReservation = {
  "Nombre completo": string;
  "Telefono": string | number;
  "Fecha y hora": string;
  "Profesional deseado": string;
};

type ClientProfile = {
  name: string;
  phone: string;
  totalVisits: number;
  lastVisit: DateTime;
  professionals: string[];
};

function KpiCard({ title, value, icon: Icon, description }: { title: string, value: string | number, icon: React.ElementType, description?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}

export default function ClientsPage() {
  const { settings } = useUserSettings();
  const { toast } = useToast();
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClientData = useCallback(async () => {
    const webhookUrl = settings?.clients_webhook_url;

    if (!webhookUrl) {
      setError("Por favor, configure la URL del webhook de clientes en Ajustes.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cb: Date.now() }), // Cache-busting
      });

      if (!response.ok) throw new Error(`Error de red: ${response.statusText}`);
      
      const data: RawReservation[] = await response.json();

      const clientMap = new Map<string, { visits: RawReservation[], lastVisit: DateTime }>();

      data.forEach(reservation => {
        const clientName = reservation["Nombre completo"];
        const clientPhone = String(reservation["Telefono"]);
        const visitDateStr = reservation["Fecha y hora"];
        
        if (!clientName || !clientPhone || !visitDateStr) return;

        const key = `${clientName.trim().toLowerCase()}-${clientPhone.trim()}`;
        // Google Sheets date format might be 'YYYY-MM-DD HH:mm:ss'
        const visitDate = DateTime.fromSQL(visitDateStr, { zone: 'Europe/Madrid' });

        if (!clientMap.has(key)) {
          clientMap.set(key, { visits: [], lastVisit: visitDate });
        }
        
        const clientEntry = clientMap.get(key)!;
        clientEntry.visits.push(reservation);
        if (visitDate > clientEntry.lastVisit) {
          clientEntry.lastVisit = visitDate;
        }
      });
      
      const processedClients: ClientProfile[] = Array.from(clientMap.values()).map(entry => {
        const firstVisit = entry.visits[0];
        const uniqueProfessionals = [...new Set(entry.visits.map(v => v["Profesional deseado"]))];
        
        return {
          name: firstVisit["Nombre completo"],
          phone: String(firstVisit["Telefono"]),
          totalVisits: entry.visits.length,
          lastVisit: entry.lastVisit,
          professionals: uniqueProfessionals,
        };
      });
      
      processedClients.sort((a, b) => b.totalVisits - a.totalVisits);
      setClients(processedClients);

    } catch (err: any) {
      setError(`Error al cargar los datos de clientes: ${err.message}`);
      toast({
        variant: 'destructive',
        title: 'Error de Carga',
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [settings, toast]);
  
  useEffect(() => {
    if(settings) {
        fetchClientData();
    }
  }, [settings, fetchClientData]);
  
  const kpiData = useMemo(() => {
    if (!clients || clients.length === 0) {
      return { total: 0, mostFrequent: 'N/A', avgVisits: 0 };
    }
    
    const totalVisits = clients.reduce((acc, client) => acc + client.totalVisits, 0);
    const mostFrequentClient = clients[0];
    
    return {
      total: clients.length,
      mostFrequent: mostFrequentClient.name,
      avgVisits: parseFloat((totalVisits / clients.length).toFixed(1)),
    };
  }, [clients]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card className="flex-1 flex items-center justify-center bg-destructive/10 border-destructive">
          <CardContent className="text-center text-destructive p-6">
            <CardTitle>Error de Carga</CardTitle>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-headline font-bold">Clientes</h1>
        <p className="text-muted-foreground">Tu base de clientes, ordenada por lealtad.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
          <KpiCard title="Clientes Únicos" value={kpiData.total} icon={Users} />
          <KpiCard title="Cliente Más Frecuente" value={kpiData.mostFrequent} icon={Star} description="Basado en el número de visitas" />
          <KpiCard title="Promedio de Visitas" value={kpiData.avgVisits} icon={Repeat} description="Por cliente" />
      </section>

      <section>
          <div className="space-y-4">
              {clients.map(client => (
                  <Card key={client.phone} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                  <Users className="w-6 h-6 text-muted-foreground" />
                              </div>
                              <div>
                                  <p className="font-bold text-lg text-foreground">{client.name}</p>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Phone className="w-3 h-3"/>
                                      <span>{client.phone}</span>
                                  </div>
                              </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm w-full sm:w-auto">
                              <div className="flex items-center gap-2">
                                <Repeat className="w-4 h-4 text-primary"/>
                                <span className="font-semibold">{client.totalVisits} visita(s)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                  <CalendarIcon className="w-4 h-4 text-primary"/>
                                  <span className="font-semibold">
                                      Última: {client.lastVisit.isValid ? format(client.lastVisit.toJSDate(), 'dd MMM yyyy', { locale: es }) : 'Fecha inválida'}
                                  </span>
                              </div>
                              <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                                  <UserCheck className="w-4 h-4 text-primary"/>
                                  <div className="flex flex-wrap gap-1">
                                      {client.professionals.map(prof => (
                                          <Badge key={prof} variant="secondary" className="font-normal">{prof}</Badge>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      </CardContent>
                  </Card>
              ))}
          </div>
      </section>
    </div>
  );
}
