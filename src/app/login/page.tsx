'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error de inicio de sesión',
        description: 'El correo electrónico o la contraseña son incorrectos.',
      });
    } else {
      toast({
        title: 'Inicio de sesión exitoso',
        description: 'Redirigiendo a tu dashboard...',
      });
      router.push('/dashboard');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-sm text-center">
        <Image
          src="https://i.postimg.cc/kGtCyQCD/logo2.png"
          alt="Logo"
          width={200}
          height={200}
          className="mx-auto mb-4 rounded-full"
        />
        <h2 className="text-xl font-semibold text-muted-foreground tracking-wider">
          --whatsapp manager--
        </h2>
        <form onSubmit={handleLogin} className="mt-8 space-y-6 text-left">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-card"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-card"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Iniciar sesión
          </Button>
        </form>
      </div>
      <footer className="absolute bottom-4 text-sm text-muted-foreground">
        By: AirmateAi
      </footer>
    </div>
  );
}
