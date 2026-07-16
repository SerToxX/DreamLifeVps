'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, X, Package } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice, formatDate } from '@/lib/utils';
import { toast } from '@/components/ui/toaster';

const ESTADOS = ['PENDIENTE', 'CONFIRMADA', 'EN_PREPARACION', 'ENVIADO', 'ENTREGADO', 'CANCELADO'];
const COLORS: Record<string, string> = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  CONFIRMADA: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  EN_PREPARACION: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  ENVIADO: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  ENTREGADO: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  CANCELADO: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

export default function PedidosPage() {
  const qc = useQueryClient();
  const [detail, setDetail] = useState<any>(null);
  const { data, isLoading } = useQuery({ queryKey: ['orders'], queryFn: () => api.get('/orders').then((r) => r.data) });
  const { data: detailFull } = useQuery({ queryKey: ['ord', detail?.id], queryFn: () => api.get(`/orders/${detail.id}`).then((r) => r.data), enabled: !!detail?.id });
  const { mutate: upd } = useMutation({
    mutationFn: ({ id, estado }: any) => api.patch(`/orders/${id}/status`, { estado }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); toast({ title: '✅ Estado actualizado' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' }),
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <p className="text-muted-foreground text-sm mt-1">{data?.length ?? 0} pedidos registrados</p>
      </div>

      <Card><CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="border-b border-border bg-secondary/50">
            <tr className="text-left">{['#', 'Cliente', 'Total', 'Canal', 'Estado', 'Fecha', 'Acción'].map((h) => <th key={h} className="p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">{h}</th>)}</tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Cargando...</td></tr>
            : !data?.length ? <tr><td colSpan={7} className="p-12 text-center"><Package className="w-10 h-10 text-muted-foreground mx-auto mb-2" /><p className="text-muted-foreground">No hay pedidos aún</p></td></tr>
            : data.map((o: any) => (
              <tr key={o.id} className="border-b border-border/50 hover:bg-secondary/30">
                <td className="p-3 font-mono text-xs">#{o.id}</td>
                <td className="p-3">{o.cliente?.nombre ?? 'Anónimo'} {o.cliente?.apellido ?? ''}</td>
                <td className="p-3 font-bold">{formatPrice(o.total)}</td>
                <td className="p-3 text-muted-foreground text-xs">{o.canal ?? '—'}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${COLORS[o.estado] ?? 'bg-secondary'}`}>{o.estado}</span></td>
                <td className="p-3 text-muted-foreground text-xs">{formatDate(o.createdAt)}</td>
                <td className="p-3"><div className="flex items-center gap-1">
                  <select className="bg-input border border-border rounded-md text-xs px-2 py-1" value={o.estado} onChange={(e) => upd({ id: o.id, estado: e.target.value })}>
                    {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                  <button onClick={() => setDetail(o)} className="p-1.5 hover:bg-secondary rounded-md"><Eye className="w-4 h-4" /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>

      {detail && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-bold">Pedido #{detail.id}</h2>
              <button onClick={() => setDetail(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="p-5 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2.5 rounded bg-secondary"><p className="text-xs text-muted-foreground">Estado</p><p className="font-medium">{detail.estado}</p></div>
                <div className="p-2.5 rounded bg-secondary"><p className="text-xs text-muted-foreground">Total</p><p className="font-bold">{formatPrice(detail.total)}</p></div>
                <div className="p-2.5 rounded bg-secondary col-span-2"><p className="text-xs text-muted-foreground">Cliente</p><p className="font-medium">{detail.cliente?.nombre ?? 'Anónimo'} {detail.cliente?.apellido ?? ''}</p></div>
              </div>
              {detailFull?.detalles?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Productos</p>
                  <div className="flex flex-col gap-2">
                    {detailFull.detalles.map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between p-2.5 rounded border border-border text-sm">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{d.item?.producto?.nombre}</p>
                          <p className="text-xs text-muted-foreground font-mono">{d.item?.codigoSku} · {d.cantidad} x {formatPrice(d.precioVendido ?? d.precioBase)}</p>
                        </div>
                        <span className="font-bold ml-2">{formatPrice(Number(d.cantidad) * Number(d.precioVendido ?? d.precioBase))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-border"><Button variant="outline" className="w-full" onClick={() => setDetail(null)}>Cerrar</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}
