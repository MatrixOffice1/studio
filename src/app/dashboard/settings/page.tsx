
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Users, Edit, Check, X } from 'lucide-react';
import { useUserSettings } from '@/hooks/use-user-settings';
import { supabase } from '@/lib/supabase';
import { useAuth, type UserProfile } from '@/providers/auth-provider';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as FormDescriptionComponent } from '@/components/ui/form';


const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" {...props}>
        <path fill="currentColor" d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5c0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
    </svg>
);


function UserManagement() {
    const { toast } = useToast();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

    const fetchUsers = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los usuarios.' });
      } else {
        setUsers(data || []);
      }
      setIsLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);
    
    const handleUpdateUser = async (updatedProfile: Partial<UserProfile>) => {
      if (!editingUser) return;
      setIsSubmitting(true);
      const { error } = await supabase
        .from('profiles')
        .update(updatedProfile)
        .eq('id', editingUser.id);
      
      if (error) {
        toast({ variant: 'destructive', title: 'Error al actualizar', description: error.message });
      } else {
        toast({ title: 'Usuario Actualizado', description: 'Los cambios se han guardado.' });
        setEditingUser(null);
        fetchUsers(); // Refresh user list
      }
      setIsSubmitting(false);
    };
  
    return (
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
            <div>
                <CardTitle>Gestionar Usuarios</CardTitle>
                <CardDescription>Crea y gestiona los roles de los usuarios de tu equipo.</CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}><UserPlus className="mr-2" /> Crear Usuario</Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-24">
                <Loader2 className="animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                    {editingUser?.id === user.id ? (
                        <div className="flex-1 flex gap-2 items-center">
                            <Input 
                                defaultValue={user.full_name} 
                                onBlur={(e) => setEditingUser({...editingUser, full_name: e.target.value})}
                                className="h-8"
                            />
                            <Switch 
                                checked={editingUser.is_admin}
                                onCheckedChange={(checked) => setEditingUser({...editingUser, is_admin: checked})}
                            />
                            <Label>{editingUser.is_admin ? "Admin" : "Usuario"}</Label>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleUpdateUser({ full_name: editingUser.full_name, is_admin: editingUser.is_admin })} disabled={isSubmitting}>
                                <Check className="text-green-500"/>
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingUser(null)}>
                                <X className="text-red-500"/>
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div>
                                <p className="font-semibold">{user.full_name}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`text-sm font-medium px-2 py-1 rounded-md ${user.is_admin ? 'bg-primary/20 text-primary' : 'bg-secondary'}`}>{user.is_admin ? 'Admin' : 'Usuario'}</span>
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingUser(user)}>
                                    <Edit />
                                </Button>
                            </div>
                        </>
                    )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
         <CreateUserDialog 
            isOpen={isCreateDialogOpen} 
            onOpenChange={setIsCreateDialogOpen}
            onUserCreated={fetchUsers}
        />
      </Card>
    );
}

const createUserSchema = z.object({
    email: z.string().email({ message: 'Introduce un correo electrónico válido.' }),
    password: z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' }),
    full_name: z.string().min(2, { message: 'Introduce un nombre completo.' }),
    is_admin: z.boolean().default(false),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

function CreateUserDialog({ isOpen, onOpenChange, onUserCreated }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onUserCreated: () => void }) {
    const { toast } = useToast();
    const form = useForm<CreateUserFormValues>({
        resolver: zodResolver(createUserSchema),
        defaultValues: { email: '', password: '', full_name: '', is_admin: false },
    });

    const { formState: { isSubmitting } } = form;

    const onSubmit = async (values: CreateUserFormValues) => {
        try {
            const response = await fetch('/api/create-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Ocurrió un error desconocido.');
            }

            toast({
                title: 'Usuario Creado',
                description: `El usuario ${data.full_name} ha sido creado con éxito.`,
            });
            onUserCreated(); // Refresh the user list
            onOpenChange(false); // Close the dialog
            form.reset();

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error al Crear Usuario',
                description: error.message,
            });
        }
    };
    
    useEffect(() => {
        if (!isOpen) {
            form.reset();
        }
    }, [isOpen, form]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                    <DialogDescription>
                        Completa el formulario para crear una nueva cuenta de usuario.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField control={form.control} name="full_name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre Completo</FormLabel>
                                <FormControl><Input placeholder="Ej: Juan Pérez" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Correo Electrónico</FormLabel>
                                <FormControl><Input type="email" placeholder="usuario@ejemplo.com" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="password" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contraseña</FormLabel>
                                <FormControl><Input type="password" placeholder="Mínimo 8 caracteres" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="is_admin" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <FormLabel>¿Es Administrador?</FormLabel>
                                    <FormDescriptionComponent>Los administradores pueden ver todas las secciones y gestionar usuarios.</FormDescriptionComponent>
                                </div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                        )} />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 animate-spin"/>}
                                Crear Usuario
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export default function SettingsPage() {
  const { profile } = useAuth();
  const { settings, refreshSettings } = useUserSettings();
  const [aiProvider, setAiProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [agendaWebhook, setAgendaWebhook] = useState('');
  const [availabilityWebhook, setAvailabilityWebhook] = useState('');
  const [citasWebhook, setCitasWebhook] = useState('');
  const [clientsWebhook, setClientsWebhook] = useState('');
  const [pdfWebhook, setPdfWebhook] = useState('');
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
      setPdfWebhook(settings.pdf_webhook_url || 'https://n8n.srv1002935.hstgr.cloud/webhook/pdf');
      setSyncInterval(String(settings.sync_interval || '5'));
    }
  }, [settings]);

  const handleSaveChanges = async () => {
    if (!profile) {
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
      pdf_webhook_url: pdfWebhook,
      sync_interval: parseInt(syncInterval, 10) || 5,
    };

    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: profile.id, settings: newSettings }, { onConflict: 'user_id' });

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
        {profile?.is_admin && <UserManagement />}
        
        {profile?.is_admin && (
          <>
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
                  <Label htmlFor="clients-webhook">URL del Webhook de Clientes y Facturas</Label>
                  <Input
                    id="clients-webhook"
                    placeholder="https://n8n.example.com/webhook/..."
                    value={clientsWebhook}
                    onChange={(e) => setClientsWebhook(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pdf-webhook">URL del Webhook de PDF</Label>
                  <Input
                    id="pdf-webhook"
                    placeholder="https://n8n.example.com/webhook/..."
                    value={pdfWebhook}
                    onChange={(e) => setPdfWebhook(e.target.value)}
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
          </>
        )}

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


        {profile?.is_admin && (
          <div className="flex justify-end">
            <Button onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Guardar Cambios
            </Button>
          </div>
        )}
      </div>
       <footer className="text-center text-sm text-muted-foreground pt-8">
            <p>By: AirmateAi</p>
            <p>Versión 1.9.1</p>
        </footer>
    </div>
  );
}

    
