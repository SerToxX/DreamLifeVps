'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Tag, Ticket } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice, formatDate } from '@/lib/utils';
import { toast } from '@/components/ui/toaster';

export default function MarketingPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'ofertas' | 'cupones'>('ofertas');
  const [oferta, setOferta] = useState({ nombre: '', tipoDescuento: 'PORCENTAJE', valor: '', fechaInicio: '', fechaFin: '' });
  const [cupon, setCupon] = useState({ codigo: '', tipoDescuento: 'PORCENTAJE', descuento: '', limiteUsos: '' });

  const { data: ofertas } = useQuery({ queryKey: ['ofertas'], queryFn: () => api.get('/marketing/ofertas').then((r) => r.data) });
  const { data: cupones } = useQuery({ queryKey: ['cupones'], queryFn: () => api.get('/marketing/cupones').then((r) => r.data) });

  const { mutate: crearOferta } = useMutation({
    mutationFn: () => api.post('/marketing/ofertas', {
      nombre: oferta.nombre, tipoDescuento: oferta.tipoDescuento, valor: Number(oferta.valor),
      fechaInicio: oferta.fechaInicio || new Date().toISOString(),
      fechaFin: oferta.fechaFin || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      activa: true,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ofertas'] }); setOferta({ nombre: '', tipoDescuento: 'PORCENTAJE', valor: '', fechaInicio: '', fechaFin: '' }); toast({ title: '✅ Oferta creada' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' }),
  });

  const { mutate: crearCupon } = useMutation({
    mutationFn: () => api.post('/marketing/cupones', {
      codigo: cupon.codigo.toUpperCase(), tipoDescuento: cupon.tipoDescuento, descuento: Number(cupon.descuento),
      limiteUsos: cupon.limiteUsos ? Number(cupon.limiteUsos) : undefined, activo: true,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cupones'] }); setCupon({ codigo: '', tipoDescuento: 'PORCENTAJE', descuento: '', limiteUsos: '' }); toast({ title: '✅ Cupón creado' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' }),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Marketing</h1>

      <div className="flex gap-2 mb-4 border-b border-border">
        <button onClick={() => setTab('ofertas')} className={`flex items-center gap-2 px-4 py-2 text-sm border-b-2 ${tab === 'ofertas' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground'}`}><Tag className="w-4 h-4" />Ofertas ({ofertas?.length ?? 0})</button>
        <button onClick={() => setTab('cupones')} className={`flex items-center gap-2 px-4 py-2 text-sm border-b-2 ${tab === 'cupones' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground'}`}><Ticket className="w-4 h-4" />Cupones ({cupones?.length ?? 0})</button>
      </div>

      {tab === 'ofertas' ? (
        <>
          <Card className="mb-5"><CardContent className="p-5">
            <p className="font-medium mb-4">Nueva oferta</p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Input placeholder="Nombre" value={oferta.nombre} onChange={(e) => setOferta((p) => ({ ...p, nombre: e.target.value }))} className="sm:col-span-2" />
              <select className="h-10 w-full bg-input border border-border rounded-md px-3 text-sm" value={oferta.tipoDescuento} onChange={(e) => setOferta((p) => ({ ...p, tipoDescuento: e.target.value }))}>
                <option value="PORCENTAJE">%</option><option value="MONTO">S/.</option>
              </select>
              <Input placeholder="Valor" type="number" value={oferta.valor} onChange={(e) => setOferta((p) => ({ ...p, valor: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Input type="date" value={oferta.fechaInicio} onChange={(e) => setOferta((p) => ({ ...p, fechaInicio: e.target.value }))} placeholder="Inicio" />
              <Input type="date" value={oferta.fechaFin} onChange={(e) => setOferta((p) => ({ ...p, fechaFin: e.target.value }))} placeholder="Fin" />
            </div>
            <Button onClick={() => crearOferta()} disabled={!oferta.nombre || !oferta.valor} className="gap-2 mt-3"><Plus className="w-4 h-4" />Crear oferta</Button>
          </CardContent></Card>

          <Card><CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="border-b border-border bg-secondary/50"><tr className="text-left">{['Nombre', 'Tipo', 'Valor', 'Hasta', 'Estado'].map((h) => <th key={h} className="p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">{h}</th>)}</tr></thead>
              <tbody>
                {!ofertas?.length ? <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Sin ofertas</td></tr>
                : ofertas.map((o: any) => (
                  <tr key={o.id} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="p-3 font-medium">{o.nombre}</td>
                    <td className="p-3 text-xs">{o.tipoDescuento}</td>
                    <td className="p-3 font-bold">{o.tipoDescuento === 'PORCENTAJE' ? `${o.valor}%` : formatPrice(o.valor)}</td>
                    <td className="p-3 text-muted-foreground text-xs">{formatDate(o.fechaFin)}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs ${o.activa ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-secondary'}`}>{o.activa ? 'Activa' : 'Inactiva'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent></Card>
        </>
      ) : (
        <>
          <Card className="mb-5"><CardContent className="p-5">
            <p className="font-medium mb-4">Nuevo cupón</p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Input placeholder="CÓDIGO" value={cupon.codigo} onChange={(e) => setCupon((p) => ({ ...p, codigo: e.target.value.toUpperCase() }))} />
              <select className="h-10 w-full bg-input border border-border rounded-md px-3 text-sm" value={cupon.tipoDescuento} onChange={(e) => setCupon((p) => ({ ...p, tipoDescuento: e.target.value }))}>
                <option value="PORCENTAJE">%</option><option value="MONTO">S/.</option>
              </select>
              <Input placeholder="Descuento" type="number" value={cupon.descuento} onChange={(e) => setCupon((p) => ({ ...p, descuento: e.target.value }))} />
              <Input placeholder="Límite usos" type="number" value={cupon.limiteUsos} onChange={(e) => setCupon((p) => ({ ...p, limiteUsos: e.target.value }))} />
            </div>
            <Button onClick={() => crearCupon()} disabled={!cupon.codigo || !cupon.descuento} className="gap-2 mt-3"><Plus className="w-4 h-4" />Crear cupón</Button>
          </CardContent></Card>

          <Card><CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="border-b border-border bg-secondary/50"><tr className="text-left">{['Código', 'Tipo', 'Descuento', 'Usos', 'Estado'].map((h) => <th key={h} className="p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">{h}</th>)}</tr></thead>
              <tbody>
                {!cupones?.length ? <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Sin cupones</td></tr>
                : cupones.map((c: any) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="p-3 font-mono font-bold">{c.codigo}</td>
                    <td className="p-3 text-xs">{c.tipoDescuento}</td>
                    <td className="p-3 font-bold">{c.tipoDescuento === 'PORCENTAJE' ? `${c.descuento}%` : formatPrice(c.descuento)}</td>
                    <td className="p-3 text-muted-foreground text-xs">{c.usados ?? 0} / {c.limiteUsos ?? '∞'}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs ${c.activo ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-secondary'}`}>{c.activo ? 'Activo' : 'Inactivo'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent></Card>
        </>
      )}
    </div>
  );
}
