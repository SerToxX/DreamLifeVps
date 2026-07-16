'use client';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FileText, Send } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/toaster';

export default function ReclamacionesPage() {
  const [form, setForm] = useState({ nombre: '', dni: '', correo: '', telefono: '', tipo: 'RECLAMO', detalle: '', producto: '', pedido: '' });
  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post('/support/reclamaciones', form),
    onSuccess: () => { setForm({ nombre: '', dni: '', correo: '', telefono: '', tipo: 'RECLAMO', detalle: '', producto: '', pedido: '' }); toast({ title: '✅ Reclamación registrada', description: 'Te responderemos en 30 días hábiles según Ley 29571' }); },
    onError: () => toast({ title: 'Error', variant: 'destructive' }),
  });

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <div className="text-center mb-8">
        <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <h1 className="text-3xl font-bold mb-1">Libro de reclamaciones</h1>
        <p className="text-sm text-muted-foreground">Conforme al Código de Protección y Defensa del Consumidor — Ley 29571</p>
      </div>

      <Card><CardContent className="p-6 sm:p-8 flex flex-col gap-4">
        <p className="font-bold">Datos del consumidor</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input placeholder="Nombre completo" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} required />
          <Input placeholder="DNI" value={form.dni} onChange={(e) => setForm((p) => ({ ...p, dni: e.target.value }))} required />
          <Input type="email" placeholder="Correo" value={form.correo} onChange={(e) => setForm((p) => ({ ...p, correo: e.target.value }))} required />
          <Input placeholder="Teléfono" value={form.telefono} onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))} />
        </div>

        <p className="font-bold mt-2">Tipo</p>
        <div className="grid grid-cols-2 gap-2">
          {['RECLAMO', 'QUEJA'].map((t) => (
            <button key={t} onClick={() => setForm((p) => ({ ...p, tipo: t }))} className={`p-3 rounded-md border text-sm ${form.tipo === t ? 'border-foreground bg-secondary' : 'border-border hover:border-muted-foreground'}`}>{t}</button>
          ))}
        </div>

        <p className="font-bold mt-2">Detalle</p>
        <Input placeholder="Producto / servicio" value={form.producto} onChange={(e) => setForm((p) => ({ ...p, producto: e.target.value }))} />
        <Input placeholder="N° pedido (si aplica)" value={form.pedido} onChange={(e) => setForm((p) => ({ ...p, pedido: e.target.value }))} />
        <textarea className="w-full min-h-[150px] bg-input border border-border rounded-md px-3 py-2 text-sm" placeholder="Detalle del reclamo..." value={form.detalle} onChange={(e) => setForm((p) => ({ ...p, detalle: e.target.value }))} required />

        <Button size="lg" className="gap-2 mt-2" disabled={!form.nombre || !form.dni || !form.correo || !form.detalle || isPending} onClick={() => mutate()}>
          <Send className="w-4 h-4" />{isPending ? 'Enviando...' : 'Enviar reclamación'}
        </Button>

        <p className="text-xs text-muted-foreground mt-2 text-center">El proveedor debe dar respuesta en un plazo no mayor a 30 días calendario.</p>
      </CardContent></Card>
    </div>
  );
}
