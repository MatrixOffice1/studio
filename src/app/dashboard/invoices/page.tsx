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
import { Loader2, Wallet, Calendar, AlertTriangle, FileDown, Search, RefreshCw, Sparkles, CheckCircle, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateInvoiceAnalysis } from '@/ai/flows/generate-invoice-analysis';
import { AnalysisParser } from '@/components/dashboard/analysis-parser';


type RawReservation = {
  "id"?: string;
  "row_number"?: number;
  "Nombre completo": string;
  "Telefono": string | number;
  "Servicio": string;
  "Fecha y hora": string;
  "Profesional deseado": string;
  "Precio": number | string;
  "Precio (€)": number | string;
  "Estado"?: 'Pagado' | 'Pendiente' | '';
  "id ": string;
};

export type Invoice = {
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
  const { profile } = useAuth();
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

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [isAnalysisVisible, setIsAnalysisVisible] = useState(false);

  const parseDate = (dateString: string): DateTime => {
    let dt = DateTime.fromFormat(dateString, 'dd/MM/yyyy HH:mm:ss', { zone: 'Europe/Madrid' });
    if (dt.isValid) return dt;

    dt = DateTime.fromFormat(dateString, 'd/M/yyyy HH:mm:ss', { zone: 'Europe/Madrid' });
    if (dt.isValid) return dt;
    
    dt = DateTime.fromSQL(dateString, { zone: 'Europe/Madrid' });
    return dt;
  };

  const fetchInvoiceData = useCallback(async (isManualSync = false) => {
    if (!profile?.is_admin) {
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
        if (!phone) return 'No especificado';
        let phoneStr = String(phone).replace(/\s+/g, '');
        if (phoneStr.startsWith('+')) return phoneStr;
        if (phoneStr.length >= 9 && !phoneStr.startsWith('+')) return `+${phoneStr}`;
        return phoneStr;
      };

      const processedInvoices = data.map((reservation, index) => {
        const date = parseDate(reservation["Fecha y hora"]);
        const rawPrice = reservation["Precio (€)"] || reservation["Precio"];
        const priceString = String(rawPrice || "0").replace(/[€\s]/g, '').replace(',', '.');
        const price = parseFloat(priceString);
        const status = reservation.Estado === 'Pagado' ? 'Pagado' : 'Pendiente';
        const invoiceNumber = reservation["id "] || `F-${date.toFormat('yyMMdd')}-${String(index).padStart(3, '0')}`;
        
        return {
          invoiceNumber: String(invoiceNumber).trim(),
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
  }, [settings, toast, profile]);
  
  useEffect(() => {
    if(settings && profile?.is_admin) {
      fetchInvoiceData();
    } else {
      setIsLoading(false);
    }
  }, [settings, fetchInvoiceData, profile]);

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
    
    let originalInvoice: Invoice | undefined = invoices.find(inv => inv.invoiceNumber === invoiceNumber);
    if (!originalInvoice) return;

    const newStatus = originalInvoice.status === 'Pagado' ? 'Pendiente' : 'Pagado';
    const updatedInvoice = { ...originalInvoice, status: newStatus };

    setInvoices(prevInvoices => 
      prevInvoices.map(inv => inv.invoiceNumber === invoiceNumber ? updatedInvoice : inv)
    );
    
    setStatusLoading(prev => ({...prev, [invoiceNumber]: true}));

    try {
        const response = await fetch(sheetWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'update_status',
                invoiceNumber: updatedInvoice.invoiceNumber,
                status: updatedInvoice.status
            }),
        });

        if (!response.ok) throw new Error(`El servidor de webhook respondió con: ${response.status}`);

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
              ? { ...inv, status: originalInvoice!.status }
              : inv
          )
        );
    } finally {
        setStatusLoading(prev => ({...prev, [invoiceNumber]: false}));
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
          date: invoice.date.toISO(),
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
      
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      container.style.width = '210mm';
      container.style.position = 'fixed';
      container.style.left = '-300mm';
      document.body.appendChild(container);

      const canvas = await html2canvas(container, { scale: 2 });
      
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
    const sevenDaysAgo = now.minus({ days: 7 });

    const currentMonthInvoices = invoices.filter(inv => 
        inv.date.year === now.year && inv.date.month === now.month
    );
    const last7DaysInvoices = invoices.filter(inv => inv.date >= sevenDaysAgo);

    const totalBilledThisMonth = currentMonthInvoices.reduce((acc, inv) => acc + inv.totalPrice, 0);
    const totalBilledLast7Days = last7DaysInvoices.reduce((acc, inv) => acc + inv.totalPrice, 0);
    const pendingInvoices = invoices.filter(inv => inv.status === 'Pendiente').length;
    const paidInvoicesThisMonth = currentMonthInvoices.filter(inv => inv.status === 'Pagado').length;
    
    const formatCurrency = (amount: number) => amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

    return {
      totalBilledThisMonth: formatCurrency(totalBilledThisMonth),
      totalBilledLast7Days: formatCurrency(totalBilledLast7Days),
      pendingInvoices,
      paidInvoicesThisMonth,
    };
  }, [invoices]);

  const handleAnalyze = async () => {
    if (analysisResult && !isAnalyzing) {
      setIsAnalysisVisible(true);
      return;
    }
    
    setIsAnalyzing(true);
    setIsAnalysisVisible(true);
    try {
      if (invoices.length === 0) {
        setAnalysisResult("No hay facturas para analizar.");
        return;
      }
      
      const result = await generateInvoiceAnalysis({
        invoicesJson: JSON.stringify(invoices),
      });
      setAnalysisResult(result.analysis);

    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Error de Análisis',
        description: `No se pudo generar el análisis: ${e.message}`
      });
      setIsAnalysisVisible(false);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile?.is_admin) {
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

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Facturado (Mes Actual)" value={kpiData.totalBilledThisMonth} icon={Wallet} />
          <KpiCard title="Facturado (Últ. 7 días)" value={kpiData.totalBilledLast7Days} icon={Calendar} />
          <KpiCard title="Facturas Pagadas (Mes)" value={kpiData.paidInvoicesThisMonth} icon={CheckCircle} />
          <KpiCard title="Facturas Pendientes (Total)" value={kpiData.pendingInvoices} icon={AlertTriangle} />
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
      
      <Card className="bg-gradient-to-br from-card to-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="text-accent" />
            <span>Insights Financieros con IA</span>
          </CardTitle>
          <CardDescription>
            Genera un análisis de tus datos de facturación para identificar tendencias, patrones de ingresos y oportunidades de crecimiento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-start gap-4">
            <Button onClick={handleAnalyze} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando Análisis...
                </>
              ) : (
                'Analizar Rendimiento Financiero'
              )}
            </Button>
            {isAnalysisVisible && (
              <div className="w-full p-4 border rounded-lg bg-background mt-4">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-lg">Resultado del Análisis</h4>
                    <Button variant="ghost" size="sm" onClick={() => setIsAnalysisVisible(false)}>
                        <EyeOff className="mr-2 h-4 w-4"/>
                        Ocultar Análisis
                    </Button>
                </div>
                {isAnalyzing ? (
                  <div className="flex items-center justify-center h-24"><Loader2 className="animate-spin text-primary"/></div>
                ) : (
                  <AnalysisParser content={analysisResult} />
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
