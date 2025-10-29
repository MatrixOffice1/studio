'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LifeBuoy } from 'lucide-react';
import { useUserSettings } from '@/hooks/use-user-settings';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import Image from 'next/image';

export default function SettingsPage() {
  const { user } = useAuth();
  const { settings, refreshSettings } = useUserSettings();
  const [aiProvider, setAiProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [n8nWebhook, setN8nWebhook] = useState('');
  const [syncInterval, setSyncInterval] = useState('5');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (settings) {
      setAiProvider(settings.aiProvider || 'gemini');
      setApiKey(settings.gemini_api_key || '');
      setN8nWebhook(settings.n8n_webhook_url || '');
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
      n8n_webhook_url: n8nWebhook,
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
            <CardTitle>Integración de WhatsApp</CardTitle>
            <CardDescription>Gestiona tus conexiones de n8n y Supabase.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="n8n-webhook">URL del Webhook de n8n</Label>
              <Input
                id="n8n-webhook"
                placeholder="https://n8n.example.com/webhook/..."
                value={n8nWebhook}
                onChange={(e) => setN8nWebhook(e.target.value)}
              />
            </div>
            <div className="space-y-2">
                <Label htmlFor="sync-interval">Intervalo de Sincronización Automática (minutos)</Label>
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
                <Image src="https://i.postimg.cc/LXVKqFqv/df.png" alt="Soporte Airmate" width={120} height={120} className="rounded-full flex-shrink-0" />
                <div className='space-y-2 flex-grow'>
                    <p className="font-semibold text-lg">Soporte Técnico AirmateAi</p>
                    <p className="text-muted-foreground">+34 603 02 86 68</p>
                    <Button onClick={openSupportChat} className="mt-2">
                        <LifeBuoy className="mr-2 h-4 w-4" />
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
