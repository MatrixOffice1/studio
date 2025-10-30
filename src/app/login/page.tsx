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
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="container mx-auto flex max-w-5xl flex-1 flex-col items-center justify-center px-4 md:flex-row md:gap-12">
        {/* Left Column: Login Form */}
        <div className="w-full max-w-md md:w-1/2">
          <div className="mb-8 text-center md:text-left">
            <h1 className="text-3xl font-bold font-headline text-foreground sm:text-4xl">
              Bienvenido de nuevo
            </h1>
            <p className="mt-2 text-muted-foreground">
              Inicia sesión para gestionar tus comunicaciones.
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
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

        {/* Right Column: Logo */}
        <div className="mt-12 flex w-full items-center justify-center md:mt-0 md:w-1/2">
          <Image
            src="https://i.postimg.cc/kGtCyQCD/logo2.png"
            alt="Logo"
            width={400}
            height={400}
            className="drop-shadow-2xl"
            priority
          />
        </div>
      </div>

      <footer className="py-4 text-sm text-muted-foreground">
        By: AirmateAi
      </footer>
    </div>
  );
}
