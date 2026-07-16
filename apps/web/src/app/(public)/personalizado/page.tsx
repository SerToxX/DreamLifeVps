'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, Send } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/toaster';

export default function PersonalizadoPage() {
  const router = useRouter();
  const { isAuthenticated, hydrated, user } = useAuthStore();
  const [form, setForm] = useState({ tipo: 'Camiseta', descripcion: '', referencias: '' });

  useEffect(() => { if (hydrated && (!isAuthenticated || user?.type !== 'cliente')) router.replace('/login'); }, [hydrated, isAuthenticated, user, router]);

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post('/custom-orders', form),
    onSuccess: () => { toast({ title: '✅ Solicitud enviada', description: 'Te contactaremos pronto con la cotización' }); router.push('/mis-pedidos'); },
    onError: (e: any) => toast({ title: 'Error', description: e.response?.data?.message?.toString(), variant: 'destructive' }),
  });

  if (!hydrated) return null;
  if (!isAuthenticated) return null;

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <div className="text-center mb-8">
        <Sparkles className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Diseño personalizado</h1>
        <p className="text-muted-foreground">Cuéntanos qué tienes en mente y te enviaremos una cotización</p>
      </div>

      <Card><CardContent className="p-6 sm:p-8 flex flex-col gap-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Tipo de producto</label>
          <select className="h-10 w-full bg-input border border-border rounded-md px-3 text-sm" value={form.tipo} onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}>
            <option>Camiseta</option><option>Polo</option><option>Hoodie</option><option>Taza</option><option>Llavero</option><option>Otro</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Descripción detallada</label>
          <textarea className="w-full min-h-[150px] bg-input border border-border rounded-md px-3 py-2 text-sm" placeholder="Ej: Camiseta con el personaje X de la serie Y, color negro, talla M, frase '...' en el pecho..." value={form.descripcion} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">URL de imagen de referencia (opcional)</label>
          <Input placeholder="https://..." value={form.referencias} onChange={(e) => setForm((p) => ({ ...p, referencias: e.target.value }))} />
        </div>
        <Button size="lg" className="gap-2 mt-2" disabled={!form.descripcion || isPending} onClick={() => mutate()}>
          <Send className="w-4 h-4" />{isPending ? 'Enviando...' : 'Enviar solicitud'}
        </Button>
      </CardContent></Card>
    </div>
  );
}
