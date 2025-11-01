'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useUserSettings } from '@/hooks/use-user-settings';
import { useToast } from '@/hooks/use-toast';
import { DateTime } from 'luxon';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Users, Star, Repeat, Phone, Calendar as CalendarIcon, UserCheck, RefreshCw, Download, Hand, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { es } from 'date-fns/locale';
import { format, isValid } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';

type RawReservation = {
  "Nombre completo": string;
  "Telefono": string | number;
  "Fecha y hora": string;
  "Profesional deseado": string;
  "Servicio": string;
  "Precio (€)": number | string;
};

type ClientVisit = {
    date: DateTime;
    service: string;
    professional: string;
    price: number;
};

type ClientProfile = {
  id: string;
  name: string;
  phone: string;
  totalVisits: number;
  lastVisit: DateTime;
  professionals: string[];
  visits: ClientVisit[];
};

type UserSettings = {
  clients_webhook_url?: string;
  [key: string]: any;
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
  const { user } = useAuth();
  const { settings } = useUserSettings();
  const { toast } = useToast();
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);

  const isAdmin = user?.email === 'tony@abbaglia.com';
  
  const parseDate = (dateString: string): DateTime => {
    let dt = DateTime.fromFormat(dateString, 'dd/MM/yyyy HH:mm:ss', { zone: 'Europe/Madrid' });
    if (dt.isValid) return dt;

    dt = DateTime.fromFormat(dateString, 'd/M/yyyy HH:mm:ss', { zone: 'Europe/Madrid' });
    if (dt.isValid) return dt;
    
    dt = DateTime.fromSQL(dateString, { zone: 'Europe/Madrid' });
    return dt;
  };

  const fetchClientData = useCallback(async (isManualSync = false) => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }

    const webhookUrl = (settings as UserSettings)?.clients_webhook_url;

    if (!webhookUrl) {
      setError("Por favor, configure la URL del webhook de clientes en Ajustes.");
      if (!isManualSync) setIsLoading(false); else setIsSyncing(false);
      return;
    }

    if (!isManualSync) setIsLoading(true); else setIsSyncing(true);
    setError(null);
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cb: Date.now() }), // Cache-busting
      });

      if (!response.ok) throw new Error(`Error de red: ${response.statusText}`);
      
      const data: RawReservation[] = await response.json();

      const clientMap = new Map<string, { visits: RawReservation[], lastVisit: DateTime, normalizedPhone: string, name: string }>();
      
      const normalizePhone = (phone: string | number): string => {
        let phoneStr = String(phone).replace(/\s+/g, '');
        if (phoneStr.startsWith('+')) {
          return phoneStr;
        }
        if (phoneStr.length === 9 && !phoneStr.startsWith('34')) {
           return `+34${phoneStr}`;
        }
        if (!phoneStr.startsWith('+')) {
            return `+${phoneStr}`;
        }
        return phoneStr;
      };

      data.forEach(reservation => {
        const clientName = reservation["Nombre completo"];
        const clientPhone = String(reservation["Telefono"]);
        const visitDateStr = reservation["Fecha y hora"];
        
        if (!clientName || !clientPhone || !visitDateStr) return;

        const normalizedPhone = normalizePhone(clientPhone);
        const key = `${clientName.trim().toLowerCase()}-${normalizedPhone}`;
        const visitDate = parseDate(visitDateStr);

        if (!visitDate.isValid) return;

        if (!clientMap.has(key)) {
          clientMap.set(key, { visits: [], lastVisit: visitDate, normalizedPhone: normalizedPhone, name: clientName });
        }
        
        const clientEntry = clientMap.get(key)!;
        clientEntry.visits.push(reservation);
        if (visitDate > clientEntry.lastVisit) {
          clientEntry.lastVisit = visitDate;
        }
      });
      
      const processedClients: ClientProfile[] = Array.from(clientMap.entries()).map(([key, entry]) => {
        const uniqueProfessionals = [...new Set(entry.visits.map(v => v["Profesional deseado"]))];
        
        const visits = entry.visits.map(v => {
            const rawPrice = v["Precio (€)"];
            const priceString = String(rawPrice || "0").replace(/[€\s]/g, '').replace(',', '.');
            const price = parseFloat(priceString);
            return {
                date: parseDate(v["Fecha y hora"]),
                service: v["Servicio"],
                professional: v["Profesional deseado"],
                price: isNaN(price) ? 0 : price,
            }
        }).sort((a,b) => b.date.toMillis() - a.date.toMillis());

        return {
          id: key,
          name: entry.name,
          phone: entry.normalizedPhone,
          totalVisits: entry.visits.length,
          lastVisit: entry.lastVisit,
          professionals: uniqueProfessionals,
          visits: visits,
        };
      });
      
      processedClients.sort((a, b) => b.totalVisits - a.totalVisits);
      setClients(processedClients);

      if (isManualSync) {
        toast({ title: "Sincronizado", description: "La lista de clientes ha sido actualizada." });
      }

    } catch (err: any) {
      setError(`Error al cargar los datos de clientes: ${err.message}`);
      if(isManualSync) {
        toast({
          variant: 'destructive',
          title: 'Error de Sincronización',
          description: err.message,
        });
      }
    } finally {
      if (!isManualSync) setIsLoading(false); else setIsSyncing(false);
    }
  }, [settings, toast, isAdmin]);
  
  useEffect(() => {
    if(settings && isAdmin) {
        fetchClientData(false);
    } else {
        setIsLoading(false);
    }
  }, [settings, fetchClientData, isAdmin]);
  
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

  const downloadCSV = () => {
    const headers = "Nombre,Telefono,Visitas Totales,Ultima Visita,Profesionales";
    const rows = clients.map(client => {
      const lastVisitFormatted = client.lastVisit.isValid ? format(client.lastVisit.toJSDate(), 'yyyy-MM-dd HH:mm', { locale: es }) : 'Fecha inválida';
      const professionalsFormatted = `"${client.professionals.join(', ')}"`;
      return [client.name, client.phone, client.totalVisits, lastVisitFormatted, professionalsFormatted].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "clientes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card className="flex-1 flex items-center justify-center bg-destructive/10 border-destructive">
          <CardContent className="text-center text-destructive p-6">
            <CardTitle>Acceso Denegado</CardTitle>
            <p>No tienes permiso para ver esta sección.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !clients.length) {
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
      <header className="flex justify-between items-start">
        <div>
            <h1 className="text-2xl sm:text-3xl font-headline font-bold">Clientes</h1>
            <p className="text-muted-foreground">Tu base de clientes, ordenada por lealtad.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button onClick={downloadCSV} variant="outline" disabled={clients.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Descargar CSV
            </Button>
            <Button onClick={() => fetchClientData(true)} disabled={isSyncing}>
                {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Sincronizar
            </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
          <KpiCard title="Clientes Únicos" value={kpiData.total} icon={Users} />
          <KpiCard title="Cliente Más Frecuente" value={kpiData.mostFrequent} icon={Star} description="Basado en el número de visitas" />
          <KpiCard title="Promedio de Visitas" value={kpiData.avgVisits} icon={Repeat} description="Por cliente" />
      </section>

      <section>
          <div className="space-y-4">
              {clients.map(client => (
                  <Card key={client.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedClient(client)}>
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
                                      Última: {isValid(client.lastVisit.toJSDate()) ? format(client.lastVisit.toJSDate(), 'dd MMM yyyy', { locale: es }) : 'Fecha inválida'}
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

      <Dialog open={!!selectedClient} onOpenChange={(isOpen) => !isOpen && setSelectedClient(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Historial de Visitas de {selectedClient?.name}</DialogTitle>
            <DialogDescription>
              Un resumen de todas las citas pasadas de este cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><CalendarIcon className="inline-block mr-2 h-4 w-4" />Fecha</TableHead>
                  <TableHead><Hand className="inline-block mr-2 h-4 w-4" />Servicio</TableHead>
                  <TableHead><UserCheck className="inline-block mr-2 h-4 w-4" />Profesional</TableHead>
                  <TableHead className="text-right"><Wallet className="inline-block mr-2 h-4 w-4" />Precio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedClient?.visits.map((visit, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {visit.date.isValid ? visit.date.setLocale('es').toFormat('dd MMM yyyy, HH:mm') : 'Fecha inválida'}
                    </TableCell>
                    <TableCell>{visit.service}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{visit.professional}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {visit.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setSelectedClient(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
