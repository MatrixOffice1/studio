'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

const profileSchema = z.object({
  full_name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
});

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validation = profileSchema.safeParse({ full_name: fullName });
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    if (!profile) return;

    setIsLoading(true);
    setError(null);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', profile.id);

    if (updateError) {
      toast({
        variant: 'destructive',
        title: 'Error al actualizar',
        description: updateError.message,
      });
    } else {
      toast({
        title: 'Perfil Actualizado',
        description: 'Tu nombre se ha actualizado correctamente.',
      });
      if (refreshProfile) {
        refreshProfile();
      }
    }
    setIsLoading(false);
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-headline font-bold">Tu Perfil</h1>
        <p className="text-muted-foreground">Gestiona tu información personal.</p>
      </header>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
          <CardDescription>
            Tu dirección de correo electrónico no se puede cambiar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre Completo</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setError(null);
                }}
                placeholder="Tu nombre completo"
              />
              {error && <p className="text-sm text-destructive mt-1">{error}</p>}
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading || fullName === profile.full_name}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Guardar Cambios
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
