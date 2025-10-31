'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useUserSettings } from '@/hooks/use-user-settings';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import Image from 'next/image';

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" {...props}>
        <path fill="currentColor" d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5c0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
    </svg>
);


export default function SettingsPage() {
  const { user } = useAuth();
  const { settings, refreshSettings } = useUserSettings();
  const [aiProvider, setAiProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [agendaWebhook, setAgendaWebhook] = useState('');
  const [availabilityWebhook, setAvailabilityWebhook] = useState('');
  const [citasWebhook, setCitasWebhook] = useState('');
  const [clientsWebhook, setClientsWebhook] = useState('');
  const [syncInterval, setSyncInterval] = useState('5');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (settings) {
      setAiProvider(settings.aiProvider || 'gemini');
      setApiKey(settings.gemini_api_key || '');
      setAgendaWebhook(settings.agenda_webhook_url || '');
      setAvailabilityWebhook(settings.availability_webhook_url || 'https://n8n.srv1002935.hstgr.cloud/webhook/calendar-tony-airmate');
      setCitasWebhook(settings.citas_webhook_url || 'https://n8n.srv1002935.hstgr.cloud/webhook-test/calendar-citas-modf');
      setClientsWebhook(settings.clients_webhook_url || '');
      setSyncInterval(String(settings.sync_interval || '5'));
    }
  }, [settings]);

  const handleSaveChanges = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debes iniciar sesión para guardar la configuración.',
      });
      return;
    }

    setIsSaving(true);

    const newSettings = {
      aiProvider,
      gemini_api_key: apiKey,
      agenda_webhook_url: agendaWebhook,
      availability_webhook_url: availabilityWebhook,
      citas_webhook_url: citasWebhook,
      clients_webhook_url: clientsWebhook,
      sync_interval: parseInt(syncInterval, 10) || 5,
    };

    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: user.id, settings: newSettings }, { onConflict: 'user_id' });

    if (error) {
      console.error('Error saving settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error al Guardar',
        description: error.message || 'No se pudo guardar la configuración en la base de datos.',
      });
    } else {
      toast({
        title: 'Configuración Guardada',
        description: 'Tu configuración se ha actualizado correctamente.',
      });
      if (refreshSettings) {
        refreshSettings();
      }
    }
    
    setIsSaving(false);
  };
  
  const openSupportChat = () => {
    window.open('https://wa.me/34603028668', '_blank');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 flex flex-col min-h-screen">
      <header>
        <h1 className="text-2xl sm:text-3xl font-headline font-bold">Ajustes</h1>
        <p className="text-muted-foreground">Gestiona la configuración de tu aplicación e integraciones.</p>
      </header>

      <div className="space-y-8 flex-grow">
        <Card>
          <CardHeader>
            <CardTitle>Configuración de IA</CardTitle>
            <CardDescription>Configura tu proveedor de IA y la clave API para funciones como el resumen de chat.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ai-provider">Proveedor de IA</Label>
              <Select value={aiProvider} onValueChange={setAiProvider}>
                <SelectTrigger id="ai-provider">
                  <SelectValue placeholder="Seleccionar Proveedor de IA" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">Gemini</SelectItem>
                  <SelectItem value="openai" disabled>OpenAI (próximamente)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-key">{aiProvider === 'gemini' ? 'Gemini' : 'OpenAI'} Clave API</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Introduce tu clave API"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integración de n8n</CardTitle>
            <CardDescription>Gestiona tus webhooks para la agenda, disponibilidad y clientes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agenda-webhook">URL del Webhook de Sincronización de Agenda</Label>
              <Input
                id="agenda-webhook"
                placeholder="https://n8n.example.com/webhook/..."
                value={agendaWebhook}
                onChange={(e) => setAgendaWebhook(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="availability-webhook">URL del Webhook de Disponibilidad</Label>
              <Input
                id="availability-webhook"
                placeholder="https://n8n.example.com/webhook/..."
                value={availabilityWebhook}
                onChange={(e) => setAvailabilityWebhook(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="citas-webhook">URL del Webhook de Crear/Eliminar Cita</Label>
              <Input
                id="citas-webhook"
                placeholder="https://n8n.example.com/webhook/..."
                value={citasWebhook}
                onChange={(e) => setCitasWebhook(e.target.value)}
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="clients-webhook">URL del Webhook de Clientes</Label>
              <Input
                id="clients-webhook"
                placeholder="https://n8n.example.com/webhook/..."
                value={clientsWebhook}
                onChange={(e) => setClientsWebhook(e.target.value)}
              />
            </div>
            <div className="space-y-2">
                <Label htmlFor="sync-interval">Intervalo de Sincronización Automática de Agenda (minutos)</Label>
                <Input
                    id="sync-interval"
                    type="number"
                    placeholder="ej. 5"
                    value={syncInterval}
                    onChange={(e) => setSyncInterval(e.target.value)}
                    min="1"
                />
            </div>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Soporte</CardTitle>
                <CardDescription>¿Necesitas ayuda? Contacta con nuestro equipo de soporte.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
                <Image src="https://i.postimg.cc/FsTSyft0/df.png" alt="Soporte Airmate" width={150} height={150} className="rounded-full flex-shrink-0" />
                <div className='space-y-2 flex-grow'>
                    <p className="font-semibold text-lg">Soporte Técnico AirmateAi</p>
                    <p className="text-muted-foreground">+34 603 02 86 68</p>
                    <Button onClick={openSupportChat} className="mt-4">
                        <WhatsAppIcon className="mr-2 h-4 w-4" />
                        Abrir chat de soporte
                    </Button>
                </div>
            </CardContent>
        </Card>


        <div className="flex justify-end">
          <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Guardar Cambios
          </Button>
        </div>
      </div>
       <footer className="text-center text-sm text-muted-foreground pt-8">
            <p>By: AirmateAi</p>
            <p>Versión 1.9.1</p>
        </footer>
    </div>
  );
}
