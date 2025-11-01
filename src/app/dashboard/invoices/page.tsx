'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useUserSettings } from '@/hooks/use-user-settings';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { DateTime } from 'luxon';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Wallet, Calendar, AlertTriangle, FileDown, Search, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

type RawReservation = {
  "id "?: string;
  "Nombre completo": string;
  "Telefono": string | number;
  "Servicio": string;
  "Fecha y hora": string;
  "Profesional deseado": string;
  "Precio": number | string;
  "Precio (€)": number | string;
  "Estado"?: 'Pagado' | 'Pendiente' | '';
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

function KpiCard({ title, value, icon: Icon, description }: { title:string, value: string | number, icon: React.ElementType, description?: string }) {
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [professionalFilter, setProfessionalFilter] = useState('todos');

  const [statusLoading, setStatusLoading] = useState<Record<string, boolean>>({});
  const [pdfLoading, setPdfLoading] = useState<Record<string, boolean>>({});


  const isAdmin = user?.email === 'tony@abbaglia.com';
  
  const parseDate = (dateString: string): DateTime => {
    // Try 'DD/MM/YYYY HH:mm:ss'
    let dt = DateTime.fromFormat(dateString, 'dd/MM/yyyy HH:mm:ss', { zone: 'Europe/Madrid' });
    if (dt.isValid) return dt;

    // Try 'D/M/YYYY HH:mm:ss'
    dt = DateTime.fromFormat(dateString, 'd/M/yyyy HH:mm:ss', { zone: 'Europe/Madrid' });
    if (dt.isValid) return dt;

    // Try 'YYYY-MM-DD HH:mm:ss'
    dt = DateTime.fromSQL(dateString, { zone: 'Europe/Madrid' });
    return dt;
  };

  const fetchInvoiceData = useCallback(async (isManualSync = false) => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }

    const webhookUrl = settings?.clients_webhook_url;
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
        body: JSON.stringify({ cb: Date.now() }),
      });

      if (!response.ok) throw new Error(`Error de red: ${response.statusText}`);
      
      const data: RawReservation[] = await response.json();
      
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

      const processedInvoices = data.map((reservation, index) => {
        const date = parseDate(reservation["Fecha y hora"]);
        const rawPrice = reservation["Precio (€)"] || reservation["Precio"];
        const priceString = String(rawPrice || "0").replace(/[€\s]/g, '').replace(',', '.');
        const price = parseFloat(priceString);
        const status = reservation.Estado === 'Pagado' ? 'Pagado' : 'Pendiente';
        const idKey = 'id ' as keyof RawReservation; // Handle space in key
        const invoiceNumber = reservation[idKey] || `F-${date.toFormat('yyMMdd')}-${String(index).padStart(3, '0')}`;
        
        return {
          invoiceNumber: invoiceNumber,
          clientName: reservation["Nombre completo"],
          clientPhone: normalizePhone(String(reservation["Telefono"])),
          date: date,
          items: [{
            service: reservation["Servicio"],
            professional: reservation["Profesional deseado"],
            price: isNaN(price) ? 0 : price,
          }],
          totalPrice: isNaN(price) ? 0 : price,
          status: status,
        };
      }).filter(inv => inv.clientName && inv.date.isValid);

      
      const finalInvoices = Array.from(processedInvoices.values()).sort((a, b) => b.date.toMillis() - a.date.toMillis());
      setInvoices(finalInvoices);

      if (isManualSync) {
        toast({ title: "Sincronizado", description: "La lista de facturas ha sido actualizada." });
      }

    } catch (err: any) {
      setError(`Error al cargar las facturas: ${err.message}`);
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
      fetchInvoiceData();
    } else {
      setIsLoading(false);
    }
  }, [settings, fetchInvoiceData, isAdmin]);

  const handleStatusToggle = async (invoiceNumber: string) => {
    const sheetWebhookUrl = settings?.clients_webhook_url;
    if (!sheetWebhookUrl) {
      toast({
        variant: 'destructive',
        title: 'Error de Configuración',
        description: 'Falta la URL del webhook de Clientes y Facturas en los ajustes.',
      });
      return;
    }
    
    let updatedInvoice: Invoice | undefined;
    const newStatus = invoices.find(inv => inv.invoiceNumber === invoiceNumber)?.status === 'Pagado' ? 'Pendiente' : 'Pagado';

    setInvoices(prevInvoices => 
      prevInvoices.map(inv => {
        if (inv.invoiceNumber === invoiceNumber) {
          updatedInvoice = { ...inv, status: newStatus };
          return updatedInvoice;
        }
        return inv;
      })
    );
    
    setStatusLoading(prev => ({...prev, [invoiceNumber]: true}));

    if (updatedInvoice) {
      try {
        await fetch(sheetWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ...updatedInvoice, 
            date: updatedInvoice.date.toISO() // Serialize date for JSON
          }),
        });
        toast({
          title: `Estado actualizado a ${newStatus}`,
          description: `La factura ${invoiceNumber} se ha marcado como ${newStatus.toLowerCase()}.`,
        });
      } catch (error: any) {
         toast({
          variant: 'destructive',
          title: 'Error de red',
          description: `No se pudo actualizar el estado: ${error.message}`,
        });
         // Revert state on error
        setInvoices(prevInvoices => 
          prevInvoices.map(inv => 
            inv.invoiceNumber === invoiceNumber 
              ? { ...inv, status: inv.status === 'Pagado' ? 'Pendiente' : 'Pagado' }
              : inv
          )
        );
      } finally {
        setStatusLoading(prev => ({...prev, [invoiceNumber]: false}));
      }
    }
  };

  const handlePdfDownload = async (invoice: Invoice) => {
    const pdfWebhookUrl = settings?.pdf_webhook_url;
     if (!pdfWebhookUrl) {
      toast({
        variant: 'destructive',
        title: 'Error de Configuración',
        description: 'Falta la URL del webhook de PDF en los ajustes.',
      });
      return;
    }

    setPdfLoading(prev => ({...prev, [invoice.invoiceNumber]: true}));
    try {
      const response = await fetch(pdfWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...invoice,
          date: invoice.date.toISO(), // Serialize date for JSON
        }),
      });

      if (!response.ok) {
        throw new Error(`El servidor respondió con el estado ${response.status}`);
      }
      
      const data = await response.json();
      const htmlContent = data[0]?.html;

      if (!htmlContent) {
          throw new Error("La respuesta del webhook no contenía HTML válido.");
      }
      
      const pdf = new jsPDF('p', 'pt', 'a4');
      
      // We need to create a temporary element to render the HTML for html2canvas
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      container.style.width = '210mm';
      container.style.position = 'fixed';
      container.style.left = '-300mm'; // Position off-screen
      document.body.appendChild(container);

      const canvas = await html2canvas(container, {
          scale: 2, // Increase scale for better quality
      });
      
      document.body.removeChild(container);

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`factura-${invoice.invoiceNumber}.pdf`);

      toast({
        title: 'PDF Generado',
        description: `Se ha iniciado la descarga de la factura ${invoice.invoiceNumber}.`,
      });

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al Descargar PDF',
        description: `No se pudo generar el PDF: ${error.message}`,
      });
    } finally {
      setPdfLoading(prev => ({...prev, [invoice.invoiceNumber]: false}));
    }
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
    const now = DateTime.now().setZone('Europe/Madrid');
    const currentMonthInvoices = invoices.filter(inv => {
      const invDate = inv.date.setZone('Europe/Madrid');
      return invDate.hasSame(now, 'month') && invDate.hasSame(now, 'year');
    });
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
      <header className="flex justify-between items-start">
        <div>
            <h1 className="text-2xl sm:text-3xl font-headline font-bold">Facturación</h1>
            <p className="text-muted-foreground">Gestiona y revisa las facturas de tus clientes.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button onClick={() => fetchInvoiceData(true)} disabled={isSyncing}>
                {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Sincronizar
            </Button>
        </div>
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
                          {statusLoading[invoice.invoiceNumber] ? <Loader2 className="h-4 w-4 animate-spin" /> : invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {invoice.totalPrice.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="outline" size="sm" onClick={() => handlePdfDownload(invoice)} disabled={pdfLoading[invoice.invoiceNumber]}>
                          {pdfLoading[invoice.invoiceNumber] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
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

    