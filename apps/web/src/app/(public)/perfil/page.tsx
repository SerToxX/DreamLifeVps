'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, UserCircle, Mail, Phone, MapPin, FileText, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/toaster';

export default function PerfilPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { isAuthenticated, user, hydrated } = useAuthStore();
  const [form, setForm] = useState({ nombre: '', apellido: '', dni: '', telefono: '', direccion: '' });

  useEffect(() => {
    if (hydrated && (!isAuthenticated || user?.type !== 'cliente')) router.replace('/login');
  }, [hydrated, isAuthenticated, user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/customers/me').then((r) => r.data),
    enabled: isAuthenticated && user?.type === 'cliente',
  });

  useEffect(() => {
    if (data) setForm({
      nombre: data.nombre ?? '',
      apellido: data.apellido ?? '',
      dni: data.dni ?? '',
      telefono: data.telefono ?? '',
      direccion: data.direccion ?? '',
    });
  }, [data]);

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.put('/customers/me', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['profile'] }); toast({ title: '✅ Perfil actualizado' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' }),
  });

  if (!hydrated || isLoading) {
    return <div className="container mx-auto py-24 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Mi perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestiona tu información personal</p>
      </div>

      {/* Status card */}
      <Card className="mb-6 bg-secondary border-border">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
            {form.nombre?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold">{form.nombre} {form.apellido}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Mail className="w-3.5 h-3.5" />{data?.correo}
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 text-center sm:border-l sm:border-border sm:pl-4">
            <div>
              <p className="text-xs text-muted-foreground">Nivel</p>
              <p className="font-bold flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" />{data?.nivel}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Puntos</p>
              <p className="font-bold">{data?.puntos}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <h2 className="font-bold mb-6 flex items-center gap-2"><UserCircle className="w-5 h-5" />Datos personales</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Nombres</label>
              <Input value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Apellidos</label>
              <Input value={form.apellido} onChange={(e) => setForm((p) => ({ ...p, apellido: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1"><FileText className="w-3 h-3" />DNI</label>
              <Input value={form.dni} onChange={(e) => setForm((p) => ({ ...p, dni: e.target.value }))} maxLength={20} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1"><Phone className="w-3 h-3" />Teléfono</label>
              <Input value={form.telefono} onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1"><MapPin className="w-3 h-3" />Dirección</label>
              <Input value={form.direccion} onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value }))} placeholder="Av. Principal 123, Distrito, Ciudad" />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <Button size="lg" className="gap-2 w-full sm:w-auto" disabled={isPending} onClick={() => mutate()}>
              <Save className="w-4 h-4" />{isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
