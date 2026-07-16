'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice, formatDate } from '@/lib/utils';
import { toast } from '@/components/ui/toaster';

export default function FinanzasPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ descripcion: '', monto: '', categoria: '' });
  const { data: summary } = useQuery({ queryKey: ['fin-sum'], queryFn: () => api.get('/finance/summary').then((r) => r.data) });
  const { data: gastos } = useQuery({ queryKey: ['fin-gas'], queryFn: () => api.get('/finance/gastos').then((r) => r.data) });

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post('/finance/gastos', { descripcion: form.descripcion, monto: Number(form.monto), categoria: form.categoria || 'general' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fin-gas'] }); qc.invalidateQueries({ queryKey: ['fin-sum'] }); setForm({ descripcion: '', monto: '', categoria: '' }); toast({ title: '✅ Gasto registrado' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' }),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Finanzas</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" /><p className="text-xs text-muted-foreground">Ingresos</p></div>
          <p className="text-xl sm:text-2xl font-bold">{formatPrice(summary?.ingresos ?? 0)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1"><TrendingDown className="w-4 h-4 text-accent" /><p className="text-xs text-muted-foreground">Gastos</p></div>
          <p className="text-xl sm:text-2xl font-bold">{formatPrice(summary?.gastos ?? 0)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1"><DollarSign className="w-4 h-4" /><p className="text-xs text-muted-foreground">Ganancia neta</p></div>
          <p className="text-xl sm:text-2xl font-bold">{formatPrice(summary?.gananciaNeta ?? 0)}</p>
        </CardContent></Card>
      </div>

      <Card className="mb-5"><CardContent className="p-5">
        <p className="font-medium mb-4">Registrar gasto</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Input placeholder="Descripción" value={form.descripcion} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))} className="sm:col-span-2" />
          <Input placeholder="Monto (S/.)" type="number" value={form.monto} onChange={(e) => setForm((p) => ({ ...p, monto: e.target.value }))} />
          <Input placeholder="Categoría" value={form.categoria} onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value }))} />
        </div>
        <Button onClick={() => mutate()} disabled={isPending || !form.descripcion || !form.monto} className="gap-2 mt-3 w-full sm:w-auto"><Plus className="w-4 h-4" />Agregar gasto</Button>
      </CardContent></Card>

      <Card><CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead className="border-b border-border bg-secondary/50"><tr className="text-left">{['Descripción', 'Monto', 'Categoría', 'Fecha'].map((h) => <th key={h} className="p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">{h}</th>)}</tr></thead>
          <tbody>
            {!gastos?.length ? <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Sin gastos registrados</td></tr>
            : gastos.map((g: any) => (
              <tr key={g.id} className="border-b border-border/50 hover:bg-secondary/30">
                <td className="p-3">{g.descripcion}</td>
                <td className="p-3 font-bold text-accent">- {formatPrice(g.monto)}</td>
                <td className="p-3 text-muted-foreground text-xs">{g.categoria ?? '—'}</td>
                <td className="p-3 text-muted-foreground text-xs">{formatDate(g.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>
    </div>
  );
}
