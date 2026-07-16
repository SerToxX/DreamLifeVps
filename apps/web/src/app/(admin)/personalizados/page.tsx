'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, X, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate, formatPrice } from '@/lib/utils';
import { toast } from '@/components/ui/toaster';

const ESTADOS = ['PENDIENTE', 'EN_REVISION', 'COTIZADO', 'APROBADO', 'EN_PRODUCCION', 'TERMINADO', 'CANCELADO'];

export default function PersonalizadosPage() {
  const qc = useQueryClient();
  const [detail, setDetail] = useState<any>(null);
  const [cotizacion, setCotizacion] = useState({ precio: '', notas: '' });

  const { data, isLoading } = useQuery({ queryKey: ['personalizados'], queryFn: () => api.get('/custom-orders').then((r) => r.data) });

  const { mutate: changeStatus } = useMutation({
    mutationFn: ({ id, estado }: any) => api.patch(`/custom-orders/${id}`, { estado }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['personalizados'] }); toast({ title: '✅ Estado actualizado' }); },
  });

  const { mutate: cotizar } = useMutation({
    mutationFn: () => api.patch(`/custom-orders/${detail.id}`, { estado: 'COTIZADO', precioEstimado: Number(cotizacion.precio), notasInternas: cotizacion.notas }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['personalizados'] }); toast({ title: '✅ Cotización enviada' }); setDetail(null); setCotizacion({ precio: '', notas: '' }); },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Pedidos personalizados</h1>
      <p className="text-muted-foreground text-sm mb-6">Solicitudes de diseños exclusivos de los clientes</p>

      <Card><CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="border-b border-border bg-secondary/50"><tr className="text-left">{['#', 'Cliente', 'Tipo', 'Estado', 'Fecha', 'Acción'].map((h) => <th key={h} className="p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">{h}</th>)}</tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Cargando...</td></tr>
            : !data?.length ? <tr><td colSpan={6} className="p-12 text-center"><Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-2" /><p className="text-muted-foreground">No hay solicitudes aún</p></td></tr>
            : data.map((p: any) => (
              <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30">
                <td className="p-3 font-mono text-xs">#{p.id}</td>
                <td className="p-3">{p.cliente?.nombre ?? 'Anónimo'}</td>
                <td className="p-3 text-muted-foreground text-xs">{p.tipo ?? 'Camiseta'}</td>
                <td className="p-3">
                  <select className="bg-input border border-border rounded-md text-xs px-2 py-1" value={p.estado} onChange={(e) => changeStatus({ id: p.id, estado: e.target.value })}>
                    {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                </td>
                <td className="p-3 text-muted-foreground text-xs">{formatDate(p.createdAt)}</td>
                <td className="p-3"><button onClick={() => { setDetail(p); setCotizacion({ precio: String(p.precioEstimado ?? ''), notas: p.notasInternas ?? '' }); }} className="p-1.5 hover:bg-secondary rounded-md"><Eye className="w-4 h-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>

      {detail && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-bold">Solicitud #{detail.id}</h2>
              <button onClick={() => setDetail(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="p-3 rounded bg-secondary"><p className="text-xs text-muted-foreground">Cliente</p><p className="font-medium">{detail.cliente?.nombre ?? 'Anónimo'} {detail.cliente?.apellido ?? ''}</p><p className="text-xs text-muted-foreground">{detail.cliente?.correo}</p></div>
              <div className="p-3 rounded bg-secondary"><p className="text-xs text-muted-foreground">Descripción</p><p className="text-sm whitespace-pre-wrap">{detail.descripcion ?? '—'}</p></div>
              {detail.referencias && <div className="p-3 rounded bg-secondary"><p className="text-xs text-muted-foreground">Referencias</p><p className="text-xs break-all">{detail.referencias}</p></div>}
              <div className="border-t border-border pt-3">
                <p className="font-medium text-sm mb-2">Cotización</p>
                <Input placeholder="Precio estimado (S/.)" type="number" value={cotizacion.precio} onChange={(e) => setCotizacion((p) => ({ ...p, precio: e.target.value }))} className="mb-2" />
                <Input placeholder="Notas internas" value={cotizacion.notas} onChange={(e) => setCotizacion((p) => ({ ...p, notas: e.target.value }))} />
                <Button className="w-full mt-3" onClick={() => cotizar()} disabled={!cotizacion.precio}>Enviar cotización</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
