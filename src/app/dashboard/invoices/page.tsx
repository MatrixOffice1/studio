'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useUserSettings } from '@/hooks/use-user-settings';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { DateTime } from 'luxon';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Wallet, Calendar, AlertTriangle, FileDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type RawReservation = {
  "Nombre completo": string;
  "Telefono": string | number;
  "Servicio": string;
  "Fecha y hora": string;
  "Profesional deseado": string;
  "Precio": number | string;
};

type Invoice = {
  invoiceNumber: string;
  clientName: string;
  clientPhone: string;
  date: DateTime;
  items: { service: string; professional: string; price: number }[];
  totalPrice: number;
  status: 'Pagado' | 'Pendiente';
};

const PROFESSIONALS = ['Ana', 'Joana', 'Maria', 'Tony'];

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

export default function InvoicesPage() {
  const { user } = useAuth();
  const { settings } = useUserSettings();
  const { toast } = useToast();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [professionalFilter, setProfessionalFilter] = useState('todos');

  const isAdmin = user?.email === 'tony@abbaglia.com';

  const fetchInvoiceData = useCallback(async () => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }

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
        body: JSON.stringify({ cb: Date.now() }),
      });

      if (!response.ok) throw new Error(`Error de red: ${response.statusText}`);
      
      const data: RawReservation[] = await response.json();

      const dailyInvoicesMap = new Map<string, Invoice>();

      data.forEach((reservation, index) => {
        const clientName = reservation["Nombre completo"];
        const date = DateTime.fromSQL(reservation["Fecha y hora"], { zone: 'Europe/Madrid' });
        
        if (!date.isValid || !clientName || typeof clientName !== 'string' || clientName.trim() === '') {
            return; 
        }

        const clientKey = `${clientName.trim().toLowerCase()}-${date.toISODate()}`;
        
        const rawPrice = reservation["Precio"];
        const price = parseFloat(String(rawPrice).replace(',', '.')) || 0;

        if (dailyInvoicesMap.has(clientKey)) {
          const existingInvoice = dailyInvoicesMap.get(clientKey)!;
          existingInvoice.items.push({
            service: reservation["Servicio"],
            professional: reservation["Profesional deseado"],
            price: price,
          });
          existingInvoice.totalPrice += price;
        } else {
          const year = date.toFormat('yyyy');
          const invoiceNum = (index + 1).toString().padStart(4, '0');
          dailyInvoicesMap.set(clientKey, {
            invoiceNumber: `F-${year}-${invoiceNum}`,
            clientName: clientName,
            clientPhone: String(reservation["Telefono"]),
            date: date,
            items: [{
              service: reservation["Servicio"],
              professional: reservation["Profesional deseado"],
              price: price,
            }],
            totalPrice: price,
            status: 'Pendiente', // Default status
          });
        }
      });
      
      const processedInvoices = Array.from(dailyInvoicesMap.values()).sort((a, b) => b.date.toMillis() - a.date.toMillis());
      setInvoices(processedInvoices);

    } catch (err: any) {
      setError(`Error al cargar las facturas: ${err.message}`);
      toast({
        variant: 'destructive',
        title: 'Error de Carga',
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [settings, toast, isAdmin]);
  
  useEffect(() => {
    if(settings && isAdmin) {
      fetchInvoiceData();
    } else {
      setIsLoading(false);
    }
  }, [settings, fetchInvoiceData, isAdmin]);

  const handleStatusToggle = (invoiceNumber: string) => {
    setInvoices(prevInvoices => 
      prevInvoices.map(inv => 
        inv.invoiceNumber === invoiceNumber 
          ? { ...inv, status: inv.status === 'Pagado' ? 'Pendiente' : 'Pagado' }
          : inv
      )
    );
  };
  
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const searchMatch = searchTerm === '' || 
                          invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      const statusMatch = statusFilter === 'todos' || invoice.status.toLowerCase() === statusFilter.toLowerCase();
      
      const professionalMatch = professionalFilter === 'todos' || 
                                invoice.items.some(item => item.professional === professionalFilter);
      
      return searchMatch && statusMatch && professionalMatch;
    });
  }, [invoices, searchTerm, statusFilter, professionalFilter]);

  const kpiData = useMemo(() => {
    const now = DateTime.now();
    const currentMonthInvoices = invoices.filter(inv => inv.date.hasSame(now, 'month'));
    const totalBilledThisMonth = currentMonthInvoices.reduce((acc, inv) => acc + inv.totalPrice, 0);
    const pendingInvoices = invoices.filter(inv => inv.status === 'Pendiente').length;

    return {
      totalBilledThisMonth: totalBilledThisMonth.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }),
      totalInvoices: invoices.length,
      pendingInvoices,
    };
  }, [invoices]);
  
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
        <h1 className="text-2xl sm:text-3xl font-headline font-bold">Facturación</h1>
        <p className="text-muted-foreground">Gestiona y revisa las facturas de tus clientes.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
          <KpiCard title="Total Facturado (Mes Actual)" value={kpiData.totalBilledThisMonth} icon={Wallet} />
          <KpiCard title="Total Citas Facturadas" value={kpiData.totalInvoices} icon={Calendar} />
          <KpiCard title="Facturas Pendientes" value={kpiData.pendingInvoices} icon={AlertTriangle} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Facturas</CardTitle>
          <CardDescription>Busca y filtra a través de todas tus facturas.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
            <div className="relative w-full md:w-auto md:flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por cliente o nº de factura..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex w-full md:w-auto gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[160px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="Pagado">Pagado</SelectItem>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                </SelectContent>
              </Select>
              <Select value={professionalFilter} onValueChange={setProfessionalFilter}>
                <SelectTrigger className="w-full md:w-[160px]">
                  <SelectValue placeholder="Profesional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los prof.</SelectItem>
                  {PROFESSIONALS.map(prof => (
                    <SelectItem key={prof} value={prof}>{prof}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Nº Factura</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map(invoice => (
                    <TableRow key={invoice.invoiceNumber}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>
                        <div className="font-medium">{invoice.clientName}</div>
                        <div className="text-sm text-muted-foreground">{invoice.clientPhone}</div>
                      </TableCell>
                      <TableCell>{invoice.date.setLocale('es').toFormat('dd LLL, yyyy')}</TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={invoice.status === 'Pagado' ? 'default' : 'destructive'} 
                          className={cn('cursor-pointer transition-colors', 
                            invoice.status === 'Pagado' 
                            ? 'bg-green-100 hover:bg-green-200 text-green-800' 
                            : 'bg-orange-100 hover:bg-orange-200 text-orange-800'
                          )}
                          onClick={() => handleStatusToggle(invoice.invoiceNumber)}
                        >
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {invoice.totalPrice.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="outline" size="sm" disabled>
                          <FileDown className="mr-2 h-4 w-4" />
                          PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No se encontraron facturas con los criterios seleccionados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
